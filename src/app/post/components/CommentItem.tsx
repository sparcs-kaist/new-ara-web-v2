//답글 (대댓글 컴포넌트)
'use client'

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { formatDate } from "@/app/post/formatDate";
import { type CommentNested, type Author } from '@/lib/types/post';
import { createNestedComment } from "@/lib/api/post";
import ReplyEditor from '@/app/post/components/ReplyEditor';

interface CommentItemProps {
  comment: CommentNested;
  postNameType: number;
  myCommentProfile: Author | null;
  onPositiveVote: (commentId: number) => void;
  onNegativeVote: (commentId: number) => void;
};

const CommentItem = ({ comment, postNameType, myCommentProfile, onPositiveVote, onNegativeVote }: CommentItemProps) => {
  const [replyContent, setReplyContent] = useState('');
  const [selectedReplyNameType, setSelectedReplyNameType] = useState(1);
  const params = useParams();
  const postId = parseInt(params.id as string, 10);

  useEffect(() => {
    if (postNameType & 1) setSelectedReplyNameType(1);
    else if (postNameType & 2) setSelectedReplyNameType(2);
    else if (postNameType & 4) setSelectedReplyNameType(4); // 학교에게 전합니다 와 같은 실명제 게시판
  }, [postNameType]);

  return (
    <div className="flex flex-col w-full gap-[12px]">
      <div className="flex flex-col w-full gap-[4px]">
        <div className='flex flex-row w-full h-fit justify-between items-center'>
          <div className='flex flex-row gap-[4px] items-center font-medium'>
            <img src={comment.created_by.profile.picture} alt="example" width={20} />
            {comment.created_by.profile.nickname}
            <div className='flex text-[#B5B5B5] text-xs ml-3'>
              {formatDate(comment.created_at)}
            </div>
          </div>
          <Image src="/MoreVertical.svg" alt="" width={15} height={15} />
        </div>
        <div className="flex flex-col w-full gap-[8px] pl-[24px] max-w-full">
          {comment.content}
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
        </div>
      </div>
    </div>
  )
};

export default CommentItem;