'use client'

import { formatDate } from "@/app/post/formatDate";
import Image from "next/image";
import { useState } from "react";


interface CommentNested {
  id: number;
  is_hidden: boolean;
  my_vote: boolean | null;
  is_mine: boolean;
  content: string;
  created_by :
    {
      id: number;
      username: string;
      profile : 
      {
        picture: string;
        nickname: string;
        user: number;
        is_official: boolean;
        is_school_admin: boolean;
      };
      is_blocked: boolean;
    };
  positive_vote_count: number;
  negative_vote_count: number;
  created_at: string;
};

interface CommentItemProps {
  comment: CommentNested;
};

const CommentItem = ({comment} : CommentItemProps) => {
  const [visible, setVisible] = useState<boolean>(false);

  return (
    <div className="flex flex-col w-full gap-[12px]">
      <div className="flex flex-col w-full gap-[4px]">
        <div className='flex flex-row w-full h-fit justify-between items-center'>
          <div className='flex flex-row gap-[4px] items-center'>
            <img src={comment.created_by.profile.picture} alt="example" width={20}/>
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
            <div className='flex flex-row gap-[4px] cursor-pointer text-[#ED3A3A] text-xs items-center' onClick={() => {}}>
              {comment.my_vote == true 
                ? <Image src="/LikeFill.svg" alt="" width={24} height={24} />
                : <Image src="/Like.svg" alt="" width={24} height={24} />
              }
              {comment.positive_vote_count}
            </div>
            <div className='flex flex-row gap-[4px] cursor-pointer text-[#5B9CDE] text-xs items-center' onClick={()=> {}}>
              {comment.my_vote == false 
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