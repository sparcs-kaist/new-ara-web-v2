'use client';

import { useEffect, useState } from 'react';
import { fetchPost } from '@/lib/api/post';
import TextEditor from '@/components/TextEditor/TextEditor';

interface PostData {
  id: number;
  title: string;
  content: string;
}

export default function PostDetailPage() {
  const [post, setPost] = useState<PostData | null>(null);

  useEffect(() => {
    fetchPost({ 
      postId: 11996,
      fromView: 'all',
      current: 3,
      overrideHidden: true,
    })
      .then(data => {
        console.log('Post data:', data); // 디버깅용
        setPost(data);
      })
      .catch(console.error);
  }, []);

  if (!post) {
    return <div className="p-8 text-center">로딩 중…</div>;
  }

  return (
    <div className="flex flex-col items-center bg-white p-8 w-full min-h-screen">
      <div className="w-[70vw] max-w-7xl">
        <h1 className="text-3xl font-bold mb-6 text-[#ed3a3a]">{post.title}</h1>
        <hr className="border-t border-gray-300 mb-6" />
        
        <TextEditor 
          content={post.content} 
          editable={false} 
        />
      </div>
    </div>
  );
}