'use client';
import { useRef } from 'react';
import TextEditor from './components/TextEditor';
import PostOptionBar from './components/PostOptionBar';
import Attachments, { UploadObject } from './components/Attachments';
import type { Node as ProseMirrorNode } from 'prosemirror-model';

export default function Write() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<any>(null);
  const attachmentsRef = useRef<any>(null);

  // TextEditor가 이미지 업로드 요청 시 호출
  const handleOpenImageUpload = () => {
    fileInputRef.current?.click();
  };

  // 에디터 → Attachments (업로드) → 에디터 삽입
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editorRef.current) return;

    // ① Attachments에만 추가
    const uploads = attachmentsRef.current?.handleUpload([file]) || [];

    // ② 그 결과로 에디터에 삽입
    uploads.forEach((u: UploadObject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const src = reader.result as string;
        editorRef.current
          .chain()
          .focus()
          .attachmentImage({
            src,
            title: u.name,
            'data-attachment': u.key,
          })
          .run();
      };
      reader.readAsDataURL(u.file!);
    });

    e.target.value = '';
  };

  // 삭제 시 에디터에서도 지우기 (기존대로)
  const handleAttachmentDelete = (file: UploadObject) => {
    const editor = editorRef.current;
    if (!editor) return;

    const { state, view } = editor;
    state.doc.descendants(
      (node: ProseMirrorNode, pos: number) => {
        if (
          node.type.name === 'attachmentImage' &&
          node.attrs['data-attachment'] === file.key
        ) {
          const tr = view.state.tr.delete(pos, pos + node.nodeSize);
          view.dispatch(tr);
        }
      }
    );
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
          onDelete={handleAttachmentDelete}
        />
      </div>
    </div>
  );
}
