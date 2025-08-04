/* eslint-disable */

'use client';

import { useEffect, useState } from 'react';
import { fetchPost } from '@/lib/api/post';
import TextEditor from '@/components/TextEditor/TextEditor';
import { formatPost } from '../util/getPost';
import ReplyEditor from '@/components/TextEditor/ReplyEditor';
//import { formatDistanceToNow } from 'date-fns';
//import { ko } from 'date-fns/locale';

export interface PostData {
  id: number;
  title: string;
  content: string;
  negative_vote_count: number;
  positive_vote_count: number;
  my_vote : boolean;
}

export default function PostDetailPage() {
  const url = new URL(window.location.href);
  const path = url.pathname; // "/post/259668"

  // postId를 null로 둘 수 없어서, matching이 안되면 0으로 보내서 자동으로 404로 라우팅
  const match = path.match(/\/post\/(\d+)/);
  const postId = match ? parseInt(match[1], 10) : 0;

  const [post, setPost] = useState<PostData | null>(null);

  // 요거 Article List에도 동일하게 사용되는데 util로 빼는게 좋을지두
  /*
  const formatTimeAgo = (dateString: string) => {
    try {
      const formattedTime = formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: ko });
      return formattedTime.replace(/(약 )|( 미만)|(이상)|(거의 )/g, '');
    } catch (e) {
      console.error("시간 포맷팅 오류:", e);
      return '';
    }
  };
  */

  useEffect(() => {
    fetchPost({ 
      postId: postId,
      fromView: 'all',
      current: 3,
      overrideHidden: true,
    })
      .then(data => {
        setPost(formatPost({data}));
      })
      .catch(console.error);
  }, []);

  if (!post) {
    return <div className="p-8 text-center">로딩 중…</div>;
  }

  return (
    <div className="flex flex-col items-center bg-white p-8 w-full min-h-screen">
      <div className="flex flex-col w-[70vw] max-w-7xl gap-[20px]">
        {/* 제목 부분 */}
        <div className="flex flex-col gap-[8px]">
          <div className="text-[18px] font-bold text-black leading-[25.2px]">{post.title}</div>
          <div className="w-full h-[1px] bg-[#B5B5B5]" />
        </div>
        {/* 본문 */}
        <div className='flex flex-col gap-[40px]'>
          <TextEditor
            content={post.content} 
            editable={false} 
          />
          <div className='flex flex-row w-full h-fit justify-between items-center'>
            <div className='flex flex-row gap-[12px]'>
              <div className='flex flex-row gap-[4px] cursor-pointer text-[#ED3A3A]' onClick={() => {}}>
                {post.positive_vote_count}
              </div>
              <div className='flex flex-row gap-[4px] text-[#5B9CDE]'>
                <span className="material-symbols-outlined">thumb_down</span>
                {post.negative_vote_count}
              </div>
            </div>
          </div>
          <div className="w-full h-[1px] bg-[#B5B5B5]" />
        </div>
        {/* 댓글 부분 */}
        <ReplyEditor isNested={false} />
      </div>
    </div>
  );
}