'use client'

import { formatDate } from "@/app/post/formatDate";
import Image from "next/image";
import { useState } from "react";
import CommentItem from "./CommentItem";
import ReplyEditor from "../../../components/TextEditor/ReplyEditor";
import { type Comment } from '@/lib/types/post'; // <<< 타입 가져오기

interface CommentListProps {
  comment: Comment;
  onPositiveVote: (commentId: number) => void;
  onNegativeVote: (commentId: number) => void;
};

const CommentList = ({ comment, onPositiveVote, onNegativeVote }: CommentListProps) => {
  const [visible, setVisible] = useState<boolean>(false);

  return (
    <div className="flex flex-col w-full gap-[12px]">
      <div className="flex flex-col w-full gap-[4px]">
        <div className='flex flex-row w-full h-fit justify-between items-center'>
          <div className='flex flex-row gap-[4px] items-center'>
            <img src={comment.created_by.profile.picture} alt="example" width={20} />
            {comment.created_by.profile.nickname}
            <div className='flex text-[#B5B5B5] text-xs'>
              {formatDate(comment.created_at)}
            </div>
          </div>
          <Image src="/MoreVertical.svg" alt="" width={15} height={15} />
        </div>
        <div className="flex flex-col w-full gap-[8px] ml-[24px]">
          {comment.content}
          <div className='flex flex-row w-full h-fit gap-[8px]'>
            <div
              className='flex flex-row gap-[4px] cursor-pointer text-[#ED3A3A] text-xs items-center'
              onClick={() => onPositiveVote(comment.id)} // 좋아요 핸들러 연결
            >
              {comment.my_vote === true
                ? <Image src="/LikeFill.svg" alt="" width={24} height={24} />
                : <Image src="/Like.svg" alt="" width={24} height={24} />
              }
              {comment.positive_vote_count}
            </div>
            <div
              className='flex flex-row gap-[4px] cursor-pointer text-[#5B9CDE] text-xs items-center'
              onClick={() => onNegativeVote(comment.id)} // 싫어요 핸들러 연결
            >
              {comment.my_vote === false
                ? <Image src="/DislikeFill.svg" alt="" width={24} height={24} />
                : <Image src="/Dislike.svg" alt="" width={24} height={24} />
              }
              {comment.negative_vote_count}
            </div>
            <div className='flex flex-row gap-[4px] cursor-pointer text-[#666666] text-xs items-center' onClick={() => setVisible(!visible)}>
              <Image src="/corner-down-right.svg" alt="" width={15} height={15} />
              답글
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-col w-full gap-[12px] ml-[24px]">
        {
          comment.comments.map((val, idx) => (
            <CommentItem
              comment={val}
              key={idx}
              onPositiveVote={onPositiveVote} // 중첩 댓글에도 핸들러 전달
              onNegativeVote={onNegativeVote}
            />
          ))
        }
        {visible && <ReplyEditor isNested={true} />}
      </div>
    </div>
  )
};

export default CommentList;