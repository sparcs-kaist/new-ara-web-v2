/* eslint-disable */
'use client';

import { useEffect, useState } from 'react';
import { fetchPost } from '@/lib/api/post';
import TextEditor from '@/components/TextEditor/TextEditor';
import PostAttachmentsPopover from './components/PostAttachmentsPopover';
import { type PostData } from '@/lib/types/post'; // <<< 타입 가져오기

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
    console.log('PostDetailPage mounted');
    console.log('Calling fetchPost...');
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
        console.log('API attachments:', data.attachments);

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

        setPost(prev => {
          const newPost = {
            ...data,
            content: processedContent
          };
          console.log('setPost newPost:', newPost);
          return newPost;
        });
      })
      .catch(err => {
        alert('fetchPost error: ' + String(err));
        console.error(err);
      });
  }, []);

  if (!post) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-10 h-10 border-4 border-[#ed3a3a]/30 border-t-[#ed3a3a] rounded-full animate-spin" />
      </div>
    );
  }

  const mappedAttachments = (post.attachments ?? []).map(att => ({
    key: String(att.id),
    name: att.file?.split('/').pop() ?? 'attachment',
    url: att.file,
    type: att.mimetype.startsWith('image') ? 'image' : (att.mimetype.includes('pdf') ? 'pdf' : 'file'),
  }));
  console.log('[page.tsx] mappedAttachments:', mappedAttachments);

  const [popoverOpen, setPopoverOpen] = useState(false);

  return (
    <div className="flex flex-col items-center bg-white p-8 w-full min-h-screen">
      <div className="w-[70vw] max-w-7xl">
        <h1 className="text-3xl font-bold mb-6 text-[#ed3a3a]">{post.title}</h1>
        <hr className="border-t border-gray-300 mb-6" />
        {/* 첨부파일 모아보기 트리거 */}
        {mappedAttachments.length > 0 && (
          <div className="flex justify-end mb-2 relative">
            <span
              className="text-sm text-gray-700 font-medium cursor-pointer hover:text-red-500 px-2 py-1 bg-white border border-gray-200 rounded shadow"
              onClick={() => setPopoverOpen(o => !o)}
            >
              첨부파일 모아보기 ({mappedAttachments.length})
            </span>
            {popoverOpen && (
              <div className="absolute right-0 top-full mt-2 w-72 bg-white border border-gray-300 rounded shadow-lg p-3 space-y-2 z-30">
                {mappedAttachments.map(att => (
                  <div
                    key={att.key}
                    className="flex items-center gap-3 bg-gray-50 rounded px-2 py-1"
                  >
                    {/* 파일 타입 아이콘 */}
                    <span className="shrink-0">
                      {att.type === 'image' ? '🖼️' : att.type === 'pdf' ? '📄' : '📎'}
                    </span>
                    <span
                      className="flex-1 min-w-0 truncate text-xs text-gray-800"
                      title={att.name}
                    >
                      {att.name}
                    </span>
                    <a
                      href={att.url}
                      download={att.name}
                      className="px-2 py-0.5 text-xs bg-white border border-gray-300 rounded hover:bg-red-50 hover:text-red-500 transition"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      다운로드
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        <TextEditor
          content={post.content}
          editable={false}
        />
      </div>
    </div>
  );
}