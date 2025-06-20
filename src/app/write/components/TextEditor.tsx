// components/TextEditor.tsx
'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import LinkBookmark  from './LinkBookmark';
import AttachmentImage  from './AttachmentImage';
import { CustomCodeBlock } from './CodeBlock'; // 수정: CustomCodeBlock으로 import
import TextEditorLinkDialog from './TextEditorLinkDialog';

interface TextEditorProps {
  content?: string;
  editable?: boolean;
}

const TextEditor = ({ content = '', editable = false } : TextEditorProps) => {
  const [imgError, setImgError] = useState(false);
  const dialogRef = useRef<{ open: (defaultTitle?: string) => void }>(null);

  const editor = useEditor({
    extensions: [
      LinkBookmark,
      AttachmentImage.configure({
        errorCallback: () => setImgError(true),
      }),
      StarterKit.configure({
        codeBlock: false, // TipTap React 기본은 비활성
        heading : {
          levels: [1, 2, 3],
        }
      }),
      Underline,
      CustomCodeBlock, // CustomCodeBlock 사용
      Link.configure({ openOnClick: false }),
      Placeholder.configure({
        placeholder: 'Write something …',
      }),
    ],
    content,
  });

  // content 업데이트 시, 읽기모드에서만 적용
  useEffect(() => {
    if (editor && !editable) {
      editor.commands.setContent(content);
    }
  }, [content, editable, editor]);

  const showLinkDialog = () => {
    if (!editor) return;
    const { from, to } = editor.state.selection;
    const text = editor.state.doc.textBetween(from, to, ' ');
    dialogRef.current?.open(text);
  };

  return (
    <div
      className={`editor relative ${editable ? 'border border-gray-300 rounded-lg hover:shadow-md' : ''} ${
        editor?.isFocused ? 'shadow-md' : ''
      }`}
    >
      {/* 이미지 로드 실패 시 읽기 모드에만 표시 */}
      {!editable && imgError && (
        <blockquote className="p-4 italic border-l-4 text-gray-600">
          <strong>Failed to load image. If it is a portal notice, please click the link above.</strong>
        </blockquote>
      )}

      {/* 편집 모드 툴바 */}
      {editable && (
        <div className="sticky top-0 z-10 flex flex-wrap gap-x-4 gap-y-2 bg-gray-100 p-4 border-b border-gray-300">
          {/* 버튼들 */}
          <button
            className={`h-auto p-0 flex items-center justify-center ${editor?.isActive('bold') ? 'bg-gray-300' : ''}`}
            onClick={() => editor?.chain().focus().toggleBold().run()}
          >
            <i className="material-icons text-xl text-gray-600">format_bold</i>
          </button>
          <button
            className={`h-auto p-0 flex items-center justify-center ${editor?.isActive('italic') ? 'bg-gray-300' : ''}`}
            onClick={() => editor?.chain().focus().toggleItalic().run()}
          >
            <i className="material-icons text-xl text-gray-600">format_italic</i>
          </button>
          <button
            className={`h-auto p-0 flex items-center justify-center ${editor?.isActive('strike') ? 'bg-gray-300' : ''}`}
            onClick={() => editor?.chain().focus().toggleStrike().run()}
          >
            <i className="material-icons text-xl text-gray-600">format_strikethrough</i>
          </button>
          <button
            className={`h-auto p-0 flex items-center justify-center ${editor?.isActive('underline') ? 'bg-gray-300' : ''}`}
            onClick={() => editor?.chain().focus().toggleUnderline().run()}
          >
            <i className="material-icons text-xl text-gray-600">format_underline</i>
          </button>
          <button
            className={`h-auto p-0 flex items-center justify-center ${editor?.isActive('link') ? 'bg-gray-300' : ''}`}
            onClick={showLinkDialog}
          >
            <i className="material-icons text-xl text-gray-600">link</i>
          </button>
          <button
            className="h-auto p-0 flex items-center justify-center"
            onClick={() => editor?.chain().focus().setHorizontalRule().run()}
          >
            <i className="material-icons text-xl text-gray-600">horizontal_rule</i>
          </button>
          <button
            className={`h-auto p-0 flex items-center justify-center ${editor?.isActive('code') ? 'bg-gray-300' : ''}`}
            onClick={() => editor?.chain().focus().toggleCode().run()}
          >
            <i className="material-icons text-xl text-gray-600">code</i>
          </button>
          <button
            className={`h-auto p-0 flex items-center justify-center ${editor?.isActive('heading', { level: 1 }) ? 'bg-gray-300' : ''}`}
            onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
          >
            <i className="material-icons text-xl text-gray-600">looks_one</i>
          </button>
          <button
            className={`h-auto p-0 flex items-center justify-center ${editor?.isActive('heading', { level: 2 }) ? 'bg-gray-300' : ''}`}
            onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
          >
            <i className="material-icons text-xl text-gray-600">looks_two</i>
          </button>
          <button
            className={`h-auto p-0 flex items-center justify-center ${editor?.isActive('heading', { level: 3 }) ? 'bg-gray-300' : ''}`}
            onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
          >
            <i className="material-icons text-xl text-gray-600">looks_3</i>
          </button>
          <button
            className={`h-auto p-0 flex items-center justify-center ${editor?.isActive('bulletList') ? 'bg-gray-300' : ''}`}
            onClick={() => editor?.chain().focus().toggleBulletList().run()}
          >
            <i className="material-icons text-xl text-gray-600">format_list_bulleted</i>
          </button>
          <button
            className={`h-auto p-0 flex items-center justify-center ${editor?.isActive('orderedList') ? 'bg-gray-300' : ''}`}
            onClick={() => editor?.chain().focus().toggleOrderedList().run()}
          >
            <i className="material-icons text-xl text-gray-600">format_list_numbered</i>
          </button>
          <button
            className={`h-auto p-0 flex items-center justify-center ${editor?.isActive('blockquote') ? 'bg-gray-300' : ''}`}
            onClick={() => editor?.chain().focus().toggleBlockquote().run()}
          >
            <i className="material-icons text-xl text-gray-600">format_quote</i>
          </button>
          <button
            className={`h-auto p-0 flex items-center justify-center ${editor?.isActive('codeBlock') ? 'bg-gray-300' : ''}`}
            onClick={() => editor?.chain().focus().toggleCodeBlock().run()}
          >
            <i className="material-icons text-xl text-gray-600">code</i>
          </button>
          {/*
            <button
               onClick={() => onOpenImageUpload?.()}
               className="btn"
            >
              <i className="material-icons">image</i>
            </button>
          */}
          <button
            className="h-auto p-0 flex items-center justify-center"
            onClick={() => editor?.chain().focus().undo().run()}
          >
            <i className="material-icons text-xl text-gray-600">undo</i>
          </button>
          <button
            className="h-auto p-0 flex items-center justify-center"
            onClick={() => editor?.chain().focus().redo().run()}
          >
            <i className="material-icons text-xl text-gray-600">redo</i>
          </button>
        </div>
      )}

      {/* 실제 에디터 컨텐츠 */}
      <EditorContent
        editor={editor}
        className="prose prose-sm dark:prose-invert p-4 min-h-[10rem] max-w-none"
      />

      {/* 링크 다이얼로그 */}
      <TextEditorLinkDialog
        ref={dialogRef}
        onSubmit={(url, title, isBookmark) => {
          if (!editor) return;
          if (isBookmark) {
            editor.chain().focus().linkBookmark({ href: url, title }).run();
          } else {
            editor.chain().focus().toggleLink({ href: url }).run();
          }
        }}
      />
    </div>
  );
};

export default TextEditor;
