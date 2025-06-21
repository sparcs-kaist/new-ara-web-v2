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
import LinkBookmark from './LinkBookmark';
import AttachmentImage from './AttachmentImage';
import { CustomCodeBlock } from './CodeBlock';
import TextEditorLinkDialog from './TextEditorLinkDialog';

interface TextEditorProps {
  content?: string;
  editable?: boolean;
  onOpenImageUpload?: () => void;
}

const CODE_LANGUAGES = [
  'javascript',
  'typescript',
  'react',
  'python',
  'java',
  'c',
  'cpp',
  'rust',
  'ocaml',
  'fsharp',
];

const TextEditor = forwardRef<Editor | null, TextEditorProps>(
  ({ content = '', editable = false, onOpenImageUpload }, ref) => {
    const [imgError, setImgError] = useState(false);
    const dialogRef = useRef<{ open: (defaultTitle?: string) => void }>(null);

    const editor = useEditor({
      editorProps: {
        attributes: {
          class:
            "prose prose-sm sm:prose lg:prose-lg xl:prose-2xl m-5 focus:outline-none",
        },
      },
      extensions: [
        LinkBookmark,
        AttachmentImage.configure({
          errorCallback: () => setImgError(true),
        }),
        StarterKit.configure({
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
      ],
      content,
    });

    // Expose editor to parent
    useImperativeHandle(ref, () => editor as Editor, [editor]);

    // Only update content when not editable (view mode)
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

    const codeBlockLang = editor?.getAttributes('codeBlock')?.language || '';

    return (
      <div
        className={`editor relative transition-shadow ${
          editable ? 'border border-gray-300 rounded-xl hover:shadow-md' : ''
        } ${editor?.isFocused ? 'shadow-md' : ''}`}
      >
        {/* Error display for read-only mode */}
        {!editable && imgError && (
          <blockquote className="p-4 italic border-l-4 text-gray-600">
            <strong>
              Failed to load image. If it is a portal notice, please click the
              link above.
            </strong>
          </blockquote>
        )}

        {/* Toolbar */}
        {editable && (
          <div className="sticky top-0 z-10 flex flex-wrap gap-x-4 gap-y-2 bg-gray-100 p-4 border-b border-gray-300 items-center">
            <button
              className={`h-auto p-0 flex items-center justify-center ${
                editor?.isActive('bold') ? 'bg-gray-300' : ''
              }`}
              onClick={() => editor?.chain().focus().toggleBold().run()}
            >
              <i className="material-icons text-xl text-gray-600">
                format_bold
              </i>
            </button>
            <button
              className={`h-auto p-0 flex items-center justify-center ${
                editor?.isActive('italic') ? 'bg-gray-300' : ''
              }`}
              onClick={() => editor?.chain().focus().toggleItalic().run()}
            >
              <i className="material-icons text-xl text-gray-600">
                format_italic
              </i>
            </button>
            <button
              className={`h-auto p-0 flex items-center justify-center ${
                editor?.isActive('strike') ? 'bg-gray-300' : ''
              }`}
              onClick={() => editor?.chain().focus().toggleStrike().run()}
            >
              <i className="material-icons text-xl text-gray-600">
                format_strikethrough
              </i>
            </button>
            <button
              className={`h-auto p-0 flex items-center justify-center ${
                editor?.isActive('underline') ? 'bg-gray-300' : ''
              }`}
              onClick={() => editor?.chain().focus().toggleUnderline().run()}
            >
              <i className="material-icons text-xl text-gray-600">
                format_underline
              </i>
            </button>
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
              <i className="material-icons text-xl text-gray-600">code</i>
            </button>
            {editor?.isActive('codeBlock') && (
              <select
                className="ml-2 px-2 py-1 text-sm border rounded"
                value={codeBlockLang}
                onChange={(e) =>
                  editor.commands.updateAttributes('codeBlock', {
                    language: e.target.value,
                  })
                }
              >
                {CODE_LANGUAGES.map((lang) => (
                  <option key={lang} value={lang}>
                    {lang}
                  </option>
                ))}
              </select>
            )}
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
          className="editor-content prose prose-sm dark:prose-invert p-4 min-h-[10rem] max-w-none focus:outline-none"
        />

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
  },
);

TextEditor.displayName = 'TextEditor';
export default TextEditor;
