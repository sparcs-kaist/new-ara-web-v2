'use client';
import { useRef } from 'react';
import TextEditor from './components/TextEditor';
import PostOptionBar from './components/PostOptionBar';

export default function Write() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<any>(null); // TipTap 에디터 참조용

  const handleOpenImageUpload = () => {
    fileInputRef.current?.click();
  };

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

  return (
    <div className="flex flex-col items-center bg-white p-8 w-full min-h-screen">
      <div className="w-[80vw] max-w-7xl">
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
          ref={editorRef} // 💡 추후 삽입을 위해 ref로 에디터 접근
        />
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*"
          onChange={handleImageChange}
        />
      </div>
    </div>
  );
}