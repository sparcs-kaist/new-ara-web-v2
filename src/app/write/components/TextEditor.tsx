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
import LinkDialog from './TextEditorLinkDialog'; // Vue의 TheTextEditorLinkDialog 대응

interface TextEditorProps {
  content?: string;
  editable?: boolean;
}

const TextEditor = ({ content = '', editable = false } : TextEditorProps) => {
  const [imgError, setImgError] = useState(false);
  const dialogRef = useRef<{ showDialog: (cb: Function, title?: string) => void }>(null);

  const editor = useEditor({
    extensions: [
      LinkBookmark,
      AttachmentImage.configure({
        errorCallback: () => setImgError(true),
      }),
      StarterKit.configure({
        blockquote: {},
        codeBlock: false, // TipTap React 기본은 비활성
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
    dialogRef.current?.showDialog((url: string, title: string, isBookmark: boolean) => {
      if (!editor) return;
      if (isBookmark) {
        editor.chain().focus().linkBookmark({ href: url, title }).run();
      } else {
        editor.chain().focus().toggleLink({ href: url }).run();
      }
    }, text);
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
        <div className="sticky top-0 z-10 flex flex-wrap gap-x-4 bg-gray-100 p-4 border-b border-gray-300">
          <button onClick={() => editor?.chain().focus().toggleBold().run()} className="btn">
            <i className="material-icons">format_bold</i>
          </button>
          <button onClick={() => editor?.chain().focus().toggleItalic().run()} className="btn">
            <i className="material-icons">format_italic</i>
          </button>
          <button onClick={() => editor?.chain().focus().toggleStrike().run()} className="btn">
            <i className="material-icons">format_strikethrough</i>
          </button>
          <button onClick={() => editor?.chain().focus().toggleUnderline().run()} className="btn">
            <i className="material-icons">format_underline</i>
          </button>
          <button onClick={showLinkDialog} className="btn">
            <i className="material-icons">link</i>
          </button>
          <button onClick={() => editor?.chain().focus().setHorizontalRule().run()} className="btn">
            <i className="material-icons">horizontal_rule</i>
          </button>
          <button onClick={() => editor?.chain().focus().toggleCode().run()} className="btn">
            <i className="material-icons">code</i>
          </button>
          <button onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()} className="btn">
            <i className="material-icons">looks_one</i>
          </button>
          <button onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()} className="btn">
            <i className="material-icons">looks_two</i>
          </button>
          <button onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()} className="btn">
            <i className="material-icons">looks_3</i>
          </button>
          <button onClick={() => editor?.chain().focus().toggleBulletList().run()} className="btn">
            <i className="material-icons">format_list_bulleted</i>
          </button>
          <button onClick={() => editor?.chain().focus().toggleOrderedList().run()} className="btn">
            <i className="material-icons">format_list_numbered</i>
          </button>
          <button onClick={() => editor?.chain().focus().toggleBlockquote().run()} className="btn">
            <i className="material-icons">format_quote</i>
          </button>
          <button onClick={() => editor?.chain().focus().toggleCodeBlock().run()} className="btn">
            <i className="material-icons">code</i>
          </button>
          {/*
            <button
               onClick={() => onOpenImageUpload?.()}
               className="btn"
            >
              <i className="material-icons">image</i>
            </button>
          */}
          <button onClick={() => editor?.chain().focus().undo().run()} className="btn">
            <i className="material-icons">undo</i>
          </button>
          <button onClick={() => editor?.chain().focus().redo().run()} className="btn">
            <i className="material-icons">redo</i>
          </button>
        </div>
      )}

      {/* 실제 에디터 컨텐츠 */}
      <EditorContent editor={editor} className="prose p-4 min-h-[10rem]" />

      {/* 링크 다이얼로그 */}
    </div>
  );
};

export default TextEditor;
