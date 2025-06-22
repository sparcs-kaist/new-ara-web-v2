'use client';

import React, {
  useEffect,
  useState,
  useRef,
  forwardRef,
  useImperativeHandle,
} from 'react';
import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import LinkBookmark from '@/components/TextEditor/LinkBookmark';
import TextStyle from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Bold from '@tiptap/extension-bold';
import Italic from '@tiptap/extension-italic';

import AttachmentImage from './AttachmentImage';
import { CustomCodeBlock } from '@/components/TextEditor/CodeBlock';
import TextEditorLinkDialog from '@/components/TextEditor/TextEditorLinkDialog';

interface TextEditorProps {
  content?: string;
  editable?: boolean;
  onOpenImageUpload?: () => void;
}

const TextEditor = forwardRef<Editor | null, TextEditorProps>(
  ({ content = '', editable = false, onOpenImageUpload }, ref) => {
    const [imgError, setImgError] = useState(false);
    const dialogRef = useRef<{ open: (defaultTitle?: string) => void }>(null);

    const editor = useEditor({
      editable,
      editorProps: {
        attributes: {
          class:
            'prose prose-sm sm:prose m-5 focus:outline-none max-w-full',
        },
      },
      extensions: [
        LinkBookmark,
        AttachmentImage.configure({
          errorCallback: () => setImgError(true),
        }),

        StarterKit.configure({
          bold: false,
          italic: false,
          codeBlock: false,
          heading: {
            levels: [1, 2, 3],
          },
        }),
        Underline,
        CustomCodeBlock,
        Link.configure({ openOnClick: false }),
        Placeholder.configure({
          placeholder: 'Write something …',
          showOnlyWhenEditable: true,
        }),
        Italic,
        TextStyle,
        Color,
        Bold,
      ],
      content,
    });

    // view 모드일 땐 content만 갱신
    useEffect(() => {
      if (editor && !editable) {
        editor.commands.setContent(content);
      }
    }, [content, editable, editor]);

    // Expose editor to parent
    useImperativeHandle(ref, () => editor as Editor, [editor]);

    const showLinkDialog = () => {
      if (!editor) return;
      const { from, to } = editor.state.selection;
      const text = editor.state.doc.textBetween(from, to, ' ');
      dialogRef.current?.open(text);
    };

    return (
      <div
        className={`editor relative transition-shadow ${
          editable ? 'border border-gray-300 rounded-xl hover:shadow-md' : ''
        } ${editor?.isFocused ? 'shadow-md' : ''} mb-6`}
      >
        {/** view 모드에서 이미지 로드 에러만 보여줌 */}
        {!editable && imgError && (
          <blockquote className="p-4 italic border-l-4 text-gray-600">
            <strong>
              Failed to load image. If it is a portal notice, please click the
              link above.
            </strong>
          </blockquote>
        )}

        {/** 툴바는 editable일 때만 렌더 */}
        {editable && (
          <div className="sticky top-0 z-10 flex flex-wrap gap-x-4 gap-y-2 bg-gray-100 p-4 border-b border-gray-300 items-center">
            <button
              className={`h-auto p-0 flex items-center justify-center ${
                editor?.isActive('bold') ? 'bg-gray-300' : ''
              }`}
              onClick={() => editor?.chain().focus().toggleBold().run()}
            >
              <i className="material-icons text-xl text-gray-600">format_bold</i>
            </button>
            <button
              className={`h-auto p-0 flex items-center justify-center ${
                editor?.isActive('italic') ? 'bg-gray-300' : ''
              }`}
              onClick={() => editor?.chain().focus().toggleItalic().run()}
            >
              <i className="material-icons text-xl text-gray-600">format_italic</i>
            </button>
            <button
              className={`h-auto p-0 flex items-center justify-center ${
                editor?.isActive('strike') ? 'bg-gray-300' : ''
              }`}
              onClick={() => editor?.chain().focus().toggleStrike().run()}
            >
              <i className="material-icons text-xl text-gray-600">format_strikethrough</i>
            </button>
            <button
              className={`h-auto p-0 flex items-center justify-center ${
                editor?.isActive('underline') ? 'bg-gray-300' : ''
              }`}
              onClick={() => editor?.chain().focus().toggleUnderline().run()}
            >
              <i className="material-icons text-xl text-gray-600">format_underline</i>
            </button>

            {/* ───── Color Picker & Reset  ───── */}
            <input
              type="color"
              value={editor?.getAttributes('textStyle').color ?? '#000000'}
              onInput={e => {
                const color = e.currentTarget.value
                editor?.chain().focus().setColor(color).run()
              }}
              className="appearance-none w-4 h-4 p-0 border-none rounded-full cursor-pointer"
              title="텍스트 색상"
            />
            <button
              onClick={() => editor?.chain().focus().unsetColor().run()}
              className="h-auto p-0 flex items-center justify-center"
              title="색 초기화"
            >
              <i className="material-icons text-base">format_color_reset</i>
            </button>

            {/* Link */}
            <button
              className={`h-auto p-0 flex items-center justify-center ${
                editor?.isActive('link') ? 'bg-gray-300' : ''
              }`}
              onClick={showLinkDialog}
            >
              <i className="material-icons text-xl text-gray-600">link</i>
            </button>
            <button
              className="h-auto p-0 flex items-center justify-center"
              onClick={() => editor?.chain().focus().setHorizontalRule().run()}
            >
              <i className="material-icons text-xl text-gray-600">
                horizontal_rule
              </i>
            </button>
            <button
              className={`h-auto p-0 flex items-center justify-center ${
                editor?.isActive('code') ? 'bg-gray-300' : ''
              }`}
              onClick={() => editor?.chain().focus().toggleCode().run()}
            >
              <i className="material-icons text-xl text-gray-600">code</i>
            </button>
            <button
                className={`h-auto p-0 flex items-center justify-center ${
                    editor?.isActive('heading', { level: 1 }) ? 'bg-gray-300' : ''
                }`}
                onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
                >
                <span className="font-bold text-lg mr-1">H1</span>
            </button>
            <button
                className={`h-auto p-0 flex items-center justify-center ${
                    editor?.isActive('heading', { level: 2 }) ? 'bg-gray-300' : ''
                }`}
                onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
                >
                <span className="font-bold text-base mr-1">H2</span>
            </button>
            <button
                className={`h-auto p-0 flex items-center justify-center ${
                    editor?.isActive('heading', { level: 3 }) ? 'bg-gray-300' : ''
                }`}
                onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
                >
                <span className="font-bold text-sm mr-1">H3</span>
            </button>
            <button
              className={`h-auto p-0 flex items-center justify-center ${
                editor?.isActive('bulletList') ? 'bg-gray-300' : ''
              }`}
              onClick={() => editor?.chain().focus().toggleBulletList().run()}
            >
              <i className="material-icons text-xl text-gray-600">
                format_list_bulleted
              </i>
            </button>
            <button
              className={`h-auto p-0 flex items-center justify-center ${
                editor?.isActive('orderedList') ? 'bg-gray-300' : ''
              }`}
              onClick={() => editor?.chain().focus().toggleOrderedList().run()}
            >
              <i className="material-icons text-xl text-gray-600">
                format_list_numbered
              </i>
            </button>
            <button
              className={`h-auto p-0 flex items-center justify-center ${
                editor?.isActive('blockquote') ? 'bg-gray-300' : ''
              }`}
              onClick={() => editor?.chain().focus().toggleBlockquote().run()}
            >
              <i className="material-icons text-xl text-gray-600">
                format_quote
              </i>
            </button>
            <button
              className={`h-auto p-0 flex items-center justify-center ${
                editor?.isActive('codeBlock') ? 'bg-gray-300' : ''
              }`}
              onClick={() => editor?.chain().focus().toggleCodeBlock().run()}
            >
              <i className="material-icons text-xl text-gray-600">terminal</i>
            </button>
            <button
              onClick={() => onOpenImageUpload?.()}
              className="h-auto p-0 flex items-center justify-center"
            >
              <i className="material-icons text-xl text-gray-600">image</i>
            </button>
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

        <EditorContent
          editor={editor}
          className="editor-content w-full max-w-full text-[0.625rem] leading-relaxed dark:text-gray-100 p-4 min-h-[10rem] focus:outline-none"
        />

        {/** 링크 대화상자 */}
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
  }
);

TextEditor.displayName = 'TextEditor';
export default TextEditor;
