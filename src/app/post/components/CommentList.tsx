// 댓글 컴포넌트
'use client'

import { useState, useEffect } from "react";
import Image from "next/image";
import { formatDate } from "@/app/post/formatDate";
import { type Comment, type Author } from '@/lib/types/post';
import { createNestedComment, deleteComment } from "@/lib/api/post";
import CommentItem from "./CommentItem";
import ReplyEditor from '@/app/post/components/ReplyEditor';
import CommentMenuPopover from "./CommentMenuPopover";

interface CommentListProps {
  comment: Comment;
  postNameType: number;
  myCommentProfile: Author | null;
  onPositiveVote: (commentId: number) => void;
  onNegativeVote: (commentId: number) => void;
  onReport: (commentId: number) => void; // onReport prop 추가
};

const CommentList = ({ comment, postNameType, myCommentProfile, onPositiveVote, onNegativeVote, onReport }: CommentListProps) => {
  const [isReplyVisible, setReplyVisible] = useState<boolean>(false);
  const [replyContent, setReplyContent] = useState('');
  const [selectedReplyNameType, setSelectedReplyNameType] = useState(1);
  const [menuVisible, setMenuVisible] = useState(false);

  const isDeleted = comment.is_hidden && comment.why_hidden?.includes("DELETED_CONTENT");

  useEffect(() => {
    if (postNameType & 1) setSelectedReplyNameType(1);
    else if (postNameType & 2) setSelectedReplyNameType(2);
  }, [postNameType]);

  const handleReplySubmit = async () => {
    if (!replyContent.trim()) {
      alert("내용을 입력해주세요.");
      return;
    }
    try {
      await createNestedComment({
        commentContent: replyContent,
        name_type: selectedReplyNameType,
        parent_comment_id: comment.id,
      });
      alert("답글이 등록되었습니다.");
      window.location.reload();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || "답글 작성 중 오류가 발생했습니다.";
      alert(errorMessage);
    }
  };

  const handleReplyCancel = () => {
    setReplyContent('');
    setReplyVisible(false);
  };

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
    alert('수정 기능은 준비 중입니다.');
  };

  return (
    // 최상위 div에 border-b와 padding 추가
    <div className="flex flex-col w-full gap-[12px] border-b border-gray-200 py-2">
      <div className="flex flex-col w-full gap-[4px]">
        <div className='flex flex-row w-full h-fit justify-between items-center'>
          <div className='flex flex-row gap-[4px] items-center font-medium'>
            <img src={comment.created_by.profile.picture} alt="example" width={20} />
            {comment.created_by.profile.nickname}
            <div className='flex text-[#B5B5B5] text-xs ml-2'>
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
        <div className="flex flex-col w-full gap-[8px] pl-[24px]">
          {/* whitespace-pre-wrap 클래스 추가 */}
          <div className="whitespace-pre-wrap">
            {isDeleted ? <span className="text-gray-500">삭제된 댓글입니다.</span> : comment.content}
          </div>
          {!isDeleted && (
            <>
              <div className='flex flex-row w-full h-fit gap-[8px]'>
                <div className='flex flex-row gap-[4px] cursor-pointer text-[#ED3A3A] text-xs items-center' onClick={() => onPositiveVote(comment.id)}>
                  {comment.my_vote === true
                    ? <Image src="/LikeFill.svg" alt="" width={24} height={24} />
                    : <Image src="/Like.svg" alt="" width={24} height={24} />
                  }
                  {comment.positive_vote_count}
                </div>
                <div className='flex flex-row gap-[4px] cursor-pointer text-[#5B9CDE] text-xs items-center' onClick={() => onNegativeVote(comment.id)}>
                  {comment.my_vote === false
                    ? <Image src="/DislikeFill.svg" alt="" width={24} height={24} />
                    : <Image src="/Dislike.svg" alt="" width={24} height={24} />
                  }
                  {comment.negative_vote_count}
                </div>
                <div className='flex flex-row gap-[4px] cursor-pointer text-[#666666] text-xs items-center' onClick={() => setReplyVisible(!isReplyVisible)}>
                  <Image src="/corner-down-right.svg" alt="" width={15} height={15} />
                  답글
                </div>
              </div>
              {isReplyVisible && (
                <div className="mt-2">
                  {myCommentProfile && (
                    <div className='flex flex-row gap-2 items-center px-2 mb-2'>
                      <img src={myCommentProfile.profile.picture} alt="my profile" width={24} height={24} className="rounded-full" />
                      <span className="font-medium text-md">{myCommentProfile.profile.nickname}</span>
                    </div>
                  )}
                  <ReplyEditor
                    isNested={true}
                    content={replyContent}
                    onContentChange={setReplyContent}
                    onSubmit={handleReplySubmit}
                    onCancel={handleReplyCancel}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>
      {/* 대댓글 목록 */}
      <div className="flex flex-col w-full gap-[12px] pl-[24px]">
        {
          comment.comments.map((val, idx) =>
            <CommentItem
              comment={val}
              key={idx}
              postNameType={postNameType}
              myCommentProfile={myCommentProfile}
              onPositiveVote={onPositiveVote}
              onNegativeVote={onNegativeVote}
              onReport={onReport}
            />)
        }
      </div>
    </div>
  );
};

export default CommentList;