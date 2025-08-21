//답글 (대댓글 컴포넌트)
'use client'

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { formatDate } from "@/app/post/util/formatDate";
import { type CommentNested, type Author } from '@/lib/types/post';
import { deleteComment, updateComment } from "@/lib/api/post"; // updateComment import
import CommentMenuPopover from "./CommentMenuPopover";
import ReplyEditor from "./ReplyEditor"; // ReplyEditor import

interface CommentItemProps {
  comment: CommentNested;
  postNameType: number;
  myCommentProfile: Author | null;
  onPositiveVote: (commentId: number) => void;
  onNegativeVote: (commentId: number) => void;
  onReport: (commentId: number) => void; // onReport prop 추가
};

const CommentItem = ({ comment, postNameType, myCommentProfile, onPositiveVote, onNegativeVote, onReport }: CommentItemProps) => {
  const [menuVisible, setMenuVisible] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [selectedReplyNameType, setSelectedReplyNameType] = useState(1);
  const params = useParams();
  const postId = parseInt(params.id as string, 10);

  const isDeleted = comment.is_hidden && comment.why_hidden?.includes("DELETED_CONTENT");

  // 수정 관련 상태 추가
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);

  useEffect(() => {
    if (postNameType & 1) setSelectedReplyNameType(1);
    else if (postNameType & 2) setSelectedReplyNameType(2);
    else if (postNameType & 4) setSelectedReplyNameType(4); // 학교에게 전합니다 와 같은 실명제 게시판
  }, [postNameType]);

  const handleDelete = async () => {
    if (window.confirm('정말로 이 댓글을 삭제하시겠습니까?')) {
      try {
        await deleteComment(comment.id);
        alert('댓글이 삭제되었습니다.');
        window.location.reload();
      } catch (error: any) {
        console.error('댓글 삭제 실패:', error);
        alert(error.response?.data?.message || '댓글 삭제에 실패했습니다.');
      }
    }
  };

  const handleEdit = () => {
    setEditContent(comment.content);
    setIsEditing(true);
    setMenuVisible(false);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const handleUpdateSubmit = async () => {
    if (!editContent.trim()) {
      alert("내용을 입력해주세요.");
      return;
    }
    try {
      await updateComment(comment.id, editContent, comment.name_type);
      alert("댓글이 수정되었습니다.");
      window.location.reload();
    } catch (error: any) {
      console.error('댓글 수정 실패:', error);
      alert(error.response?.data?.message || '댓글 수정에 실패했습니다.');
    }
  };

  return (
    // 최상위 div에 border-b와 padding 추가
    <div className="flex flex-col w-full gap-[12px] border-b border-gray-100 py-2 last:border-b-0">
      <div className="flex flex-col w-full gap-[4px]">
        <div className='flex flex-row w-full h-fit justify-between items-center'>
          <div className='flex flex-row gap-[4px] items-center font-medium'>
            <img src={comment.created_by.profile.picture} alt="example" width={20} />
            {comment.created_by.profile.nickname}
            <div className='flex text-[#B5B5B5] text-xs ml-3'>
              {formatDate(comment.created_at)}
            </div>
          </div>
          <div className="relative">
            {!isDeleted && (
              <button onClick={() => setMenuVisible(!menuVisible)}>
                <Image src="/MoreVertical.svg" alt="더보기" width={15} height={15} />
              </button>
            )}
            {menuVisible && (
              <CommentMenuPopover
                isMine={comment.is_mine}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onReport={() => onReport(comment.id)}
                onClose={() => setMenuVisible(false)}
              />
            )}
          </div>
        </div>
        <div className="flex flex-col w-full gap-[8px] pl-[24px] max-w-full">
          {isEditing ? (
            <ReplyEditor
              isEditing={true}
              isNested={true}
              content={editContent}
              onContentChange={setEditContent}
              onSubmit={handleUpdateSubmit}
              onCancel={handleCancelEdit}
            />
          ) : (
            <>
              <div className="whitespace-pre-wrap">
                {isDeleted ? <span className="text-gray-500">삭제된 댓글입니다.</span> : comment.content}
              </div>
              {!isDeleted && (
                <div className='flex flex-row w-full h-fit gap-[8px]'>
                  <div
                    className='flex flex-row gap-[4px] cursor-pointer text-[#ED3A3A] text-xs items-center'
                    onClick={() => onPositiveVote(comment.id)}
                  >
                    {comment.my_vote === true
                      ? <Image src="/LikeFill.svg" alt="" width={24} height={24} />
                      : <Image src="/Like.svg" alt="" width={24} height={24} />
                    }
                    {comment.positive_vote_count}
                  </div>
                  <div
                    className='flex flex-row gap-[4px] cursor-pointer text-[#5B9CDE] text-xs items-center'
                    onClick={() => onNegativeVote(comment.id)}
                  >
                    {comment.my_vote === false
                      ? <Image src="/DislikeFill.svg" alt="" width={24} height={24} />
                      : <Image src="/Dislike.svg" alt="" width={24} height={24} />
                    }
                    {comment.negative_vote_count}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
};

export default CommentItem;