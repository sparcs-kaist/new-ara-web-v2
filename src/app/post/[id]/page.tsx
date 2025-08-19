/* eslint-disable */

'use client';

import { useEffect, useState } from 'react';
import { useParams, notFound } from 'next/navigation'; // notFound 추가
import { fetchPost } from '@/lib/api/post';
import TextEditor from '@/components/TextEditor/TextEditor';
import { formatPost } from '../util/getPost';
import ReplyEditor from '@/components/TextEditor/ReplyEditor';
import Image from "next/image";
import { formatDate } from '../formatDate';
import CommentList from '@/app/post/components/CommentList';

//import { formatDistanceToNow } from 'date-fns';
//import { ko } from 'date-fns/locale';

export interface PostData {
  id: number;
  title: string;
  content: string;
  negative_vote_count: number;
  positive_vote_count: number;
  my_vote: boolean | null;
  created_by:
  {
    id: number;
    username: string;
    profile:
    {
      picture: string;
      nickname: string;
      user: number;
      is_official: boolean;
      is_school_admin: boolean;
    };
    is_blocked: boolean;
  };
  parent_topic:
  {
    id: number;
    slug: string;
    ko_name: string;
    en_name: string;
  };
  parent_board:
  {
    id: number;
    slug: string;
    ko_name: string;
    en_name: string;
    is_readonly: boolean;
    name_type: number;
    group:
    {
      id: number;
      ko_name: string;
      en_name: string;
      slug: string;
    };
    banner_image: string;
    ko_banner_description: string;
    en_banner_description: string;
    top_threshold: number;
  };
  created_at: string;
  hit_count: number;
  comments: [
    {
      id: number;
      is_hidden: boolean;
      my_vote: boolean | null;
      is_mine: boolean;
      content: string;
      created_by:
      {
        id: number;
        username: string;
        profile:
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
      comments: [
        {
          id: number;
          is_hidden: boolean;
          my_vote: boolean | null;
          is_mine: boolean;
          content: string;
          created_by:
          {
            id: number;
            username: string;
            profile:
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
        }
      ];
    }
  ];
}

export default function PostDetailPage() {
  // useParams를 사용하여 URL 파라미터에서 id 직접 가져오기
  const params = useParams();
  const postId = params?.id ? parseInt(params.id as string, 10) : null;

  const [post, setPost] = useState<PostData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
    // postId가 유효한 숫자가 아니면 404 페이지로 리다이렉트
    if (!postId || isNaN(postId) || postId <= 0) {
      notFound(); // Next.js의 404 페이지로 리다이렉트
    }

    setIsLoading(true);
    fetchPost({
      postId,
      fromView: 'all',
      current: 3,
      overrideHidden: true,
    })
      .then(data => {
        setPost(formatPost({ data }));
      })
      .catch(error => {
        console.error("게시물 로딩 실패:", error);
        notFound(); // API 요청 실패 시에도 404 페이지로 리다이렉트
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [postId]);

  if (isLoading) {
    return <div className="p-8 text-center">로딩 중…</div>;
  }

  if (!post) {
    return null; // 로딩이 끝났는데 post가 null이면 이미 notFound()가 호출된 상태
  }

  return (
    <div className="flex flex-col items-center bg-white p-8 w-full min-h-screen">
      <div className="flex flex-col w-[70vw] max-w-7xl gap-[20px]">
        {/* 제목 부분 */}
        <div className="flex flex-col gap-[8px]">
          <div className="text-[18px] font-bold text-black leading-[25.2px]">{post.title}</div>
          <div className='flex flex-row w-full h-fit justify-between items-center'>
            <div className='flex flex-row gap-[4px] cursor-pointer text-[#333333] items-center' onClick={() => { }}>
              <img src={post.created_by.profile.picture} alt="example" width={20} />
              {post.created_by.profile.nickname}
              <Image src="/Chevron.svg" alt="" width={20} height={20} />
            </div>
            <div className='flex text-[#B5B5B5] text-sm' onClick={() => { }}>
              {`${formatDate(post.created_at)}  ·  조회 ${post.hit_count}`}
            </div>
          </div>
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
              <div className='flex flex-row gap-[4px] cursor-pointer text-[#ED3A3A] items-center' onClick={() => { }}>
                {post.my_vote == true
                  ? <Image src="/LikeFill.svg" alt="" width={30} height={30} />
                  : <Image src="/Like.svg" alt="" width={30} height={30} />
                }
                {post.positive_vote_count}
              </div>
              <div className='flex flex-row gap-[4px] cursor-pointer text-[#5B9CDE] items-center' onClick={() => { }}>
                {post.my_vote == false
                  ? <Image src="/DislikeFill.svg" alt="" width={30} height={30} />
                  : <Image src="/Dislike.svg" alt="" width={30} height={30} />
                }
                {post.negative_vote_count}
              </div>
            </div>
            <div className='flex flex-row gap-[4px]'>
              <div className="p-2 flex flex-row gap-2 cursor-pointer border border-[#E9E9E9] text-[#666666] rounded text-sm leading-snug">
                <Image src="/Alert.svg" alt="" width={15} height={15} />
                신고
              </div>
              <div className="p-2 flex flex-row gap-2 cursor-pointer border border-[#E9E9E9] text-[#666666] rounded text-sm leading-snug">
                <Image src="/Share.svg" alt="" width={15} height={15} />
                공유
              </div>
              <div className="p-2 flex flex-row gap-2 cursor-pointer border border-[#E9E9E9] text-[#666666] rounded text-sm leading-snug">
                <Image src="/Bookmark.svg" alt="" width={15} height={15} />
                담아두기
              </div>
            </div>
          </div>
          <div className="w-full h-[1px] bg-[#B5B5B5]" />
        </div>
        {/* 댓글 부분 */}
        {
          post.comments.map((val, idx) =>
            <CommentList comment={val} key={idx} />
          )
        }
        <ReplyEditor isNested={false} />
      </div>
    </div>
  );
}