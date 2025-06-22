'use client';

import { useEffect, useState } from 'react';
import { fetchPost } from '@/lib/api/post';
import TextEditor from '@/components/TextEditor/TextEditor';

interface PostData {
  id: number;
  title: string;
  content: string;
}

// JSON 문자열 정리 함수
const cleanJsonString = (jsonStr: string): string => {
  return jsonStr
    // HTML 태그가 포함된 href 값 정리 - 더 정확한 패턴
    .replace(/"href":"<a href="([^"]+)"[^>]*>\1<\/a>"/g, '"href":"$1"')
    // HTML 태그가 포함된 src 값 정리 - 더 정확한 패턴
    .replace(/"src":"<a href="([^"]+)"[^>]*>\1<\/a>"/g, '"src":"$1"')
    // 일반적인 HTML 태그 제거 (백업용)
    .replace(/"(href|src)":"<[^>]*>([^<]+)<\/[^>]*>"/g, '"$1":"$2"')
    // 기타 HTML 엔티티 정리
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    // 잘못된 콤마나 따옴표 정리
    .replace(/,(\s*[}\]])/g, '$1')  // 마지막 콤마 제거
    // 이스케이프되지 않은 따옴표 처리
    .replace(/([^\\])"([^",:}\]]*)"([^",:}\]]*)"([^,:}\]]*)/g, '$1"$2\\"$3\\"$4')
};

export default function PostDetailPage() {
  const [post, setPost] = useState<PostData | null>(null);

  useEffect(() => {
    fetchPost({ 
      postId: 12032,
      fromView: 'all',
      current: 3,
      overrideHidden: true,
    })
      .then(data => {
        console.log('Post data:', data);
        console.log('Content type:', typeof data.content);
        console.log('Content value:', data.content);
        
        // content 타입에 따라 처리
        let processedContent = data.content;
        
        if (typeof data.content === 'string') {
          const trimmed = data.content.trim();
          
          // JSON 형태인지 확인 ('{' 로 시작)
          if (trimmed.startsWith('{')) {
            try {
              // 1차: 그대로 파싱 시도
              processedContent = JSON.parse(trimmed);
              console.log('Content loaded as JSON from string');
            } catch (firstErr) {
              try {
                // 2차: HTML 디코딩 후 파싱 시도
                const textarea = document.createElement('textarea');
                textarea.innerHTML = trimmed;
                const decodedContent = textarea.value;
                // 강력한 JSON 정리
                const cleanedContent = cleanJsonString(decodedContent);
                console.log('Cleaned JSON:', cleanedContent.substring(1700, 1800)); // 에러 지점 근처 확인
                processedContent = JSON.parse(cleanedContent);
                console.log('Content loaded as JSON after HTML decoding');
              } catch (secondErr) {
                console.log('All JSON parse attempts failed, treating as HTML:', firstErr, secondErr);
                processedContent = data.content; // 원본 HTML 유지
              }
            }
          } else {
            // HTML 형태
            console.log('Content loaded as HTML');
            processedContent = data.content;
          }
        } else if (typeof data.content === 'object' && data.content !== null) {
          // 이미 파싱된 JSON 객체
          console.log('Content is already parsed JSON object');
          processedContent = data.content;
        }
         
         setPost({
           ...data,
           content: processedContent
         });
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