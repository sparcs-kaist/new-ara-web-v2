'use client';
import { useRef } from 'react';
import TextEditor from './components/TextEditor';
import PostOptionBar from './components/PostOptionBar';
import Attachments from './components/Attachments';

export default function Write() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<any>(null);
  const attachmentsRef = useRef<any>(null);

  // TextEditor가 이미지 업로드 요청 시 호출
  const handleOpenImageUpload = () => {
    fileInputRef.current?.click();
  };

  // 실제 이미지 파일 선택 시 처리
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editorRef.current) return;

    const reader = new FileReader();
    reader.onload = () => {
      const src = reader.result;
      if (typeof src === 'string') {
        editorRef.current.chain().focus().attachmentImage({
          src,
          title: file.name,
          'data-attachment': 'true',
        }).run();
      }
    };
    reader.readAsDataURL(file);
  };

  // Attachments 컴포넌트에 파일 직접 추가 (예: 드래그앤드롭 등)
  const handleAttachFiles = (files: File[]) => {
    attachmentsRef.current?.handleUpload(files);
  };

  // Attachments에서 새 파일 추가 시 에디터에도 이미지 추가
  const handleAddAttachments = (attachments: any[]) => {
    attachments.forEach(file => {
      if (file.type === 'image') {
        editorRef.current?.addImageByFile?.(file);
      }
    });
  };

  // Attachments에서 파일 삭제 시 에디터에서도 이미지 삭제
  const handleDeleteAttachment = (file: any) => {
    if (file.type === 'image') {
      editorRef.current?.removeImageByFile?.(file);
    }
  };

  return (
    <div className="flex flex-col items-center bg-white p-8 w-full min-h-screen">
      <div className="w-[70vw] max-w-7xl">
        <p className="text-2xl font-bold mb-4 text-[#ed3a3a]">게시물 작성하기</p>
        <hr className="border-t border-gray-300 mb-6" />
        <PostOptionBar />

        <input
          type="text"
          placeholder="제목을 입력하세요"
          className="w-full border border-gray-300 rounded px-4 py-2 mb-6 text-lg focus:outline-none focus:ring-2 focus:ring-primary-400"
        />

        <TextEditor
          editable={true}
          onOpenImageUpload={handleOpenImageUpload}
          ref={editorRef}
        />

        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*"
          onChange={handleImageChange}
        />

        <Attachments
          ref={attachmentsRef}
          onAdd={handleAddAttachments}
          onDelete={handleDeleteAttachment}
        />
      </div>
    </div>
  );
}
