'use client';

import { useEffect, useRef } from 'react';
import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import TextStyle from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Bold from '@tiptap/extension-bold';
import Italic from '@tiptap/extension-italic';
import LinkBookmark from '@/components/TextEditor/components/LinkBookmark';
import AttachmentImage from '@/components/TextEditor/components/AttachmentImage';
import { CustomCodeBlock } from '@/components/TextEditor/components/CodeBlock';
import { cleanJsonString } from '@/components/TextEditor/utils/cleanJsonString';

const PROSE_CLASS = 'prose prose-sm sm:prose focus:outline-none max-w-full';

interface AraEditorOptions {
  editable: boolean;
  content?: string | object;
  placeholder?: string;
  className?: string;
  onImageError?: () => void;
}

export default function useAraEditor({
  editable,
  content = '',
  placeholder = 'Write something …',
  className,
  onImageError,
}: AraEditorOptions) {
  const placeholderRef = useRef(placeholder);

  const editor = useEditor({
    editable,
    editorProps: {
      attributes: {
        class: className ? `${PROSE_CLASS} ${className}` : PROSE_CLASS,
      },
    },
    extensions: [
      LinkBookmark,
      AttachmentImage.configure({
        errorCallback: onImageError,
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
      Link.configure({
        openOnClick: false,
        autolink: false,
        linkOnPaste: false,
      }),
      Placeholder.configure({
        placeholder: () => placeholderRef.current,
        showOnlyWhenEditable: true,
      }),
      Italic,
      TextStyle,
      Color.configure({
        types: ['textStyle'],
      }),
      Bold,
    ],
    // The content option only applies at creation; posts load later, so the effect below sets it.
    content: '',
  });

  useEffect(() => {
    if (placeholderRef.current === placeholder) return;
    placeholderRef.current = placeholder;
    // An empty transaction makes the placeholder decoration re-read the new text.
    if (editor && !editor.isDestroyed) editor.view.dispatch(editor.state.tr);
  }, [editor, placeholder]);

  useEffect(() => {
    if (!editor || !content) {
      return;
    }

    let parsedContent: object | null = null;

    try {
      if (typeof content === 'string') {
        try {
          parsedContent = JSON.parse(content);
        } catch {
          console.log('Direct JSON parsing failed, attempting to clean and re-parse...');
          parsedContent = JSON.parse(cleanJsonString(content));
        }
      } else if (typeof content === 'object' && content !== null) {
        parsedContent = content;
      }

      if (parsedContent) {
        const currentContentStr = JSON.stringify(editor.getJSON());
        const newContentStr = JSON.stringify(parsedContent);

        // Only replace when empty or different, so an unchanged prop does not jump the caret.
        if (editor.isEmpty || currentContentStr !== newContentStr) {
          editor.commands.setContent(parsedContent, false);
        }
      }
    } catch (e) {
      if (typeof content === 'string' && editor.getText() !== content) {
        editor.commands.setContent(content, false);
      }
      console.error('Failed to parse content even after cleaning, treating as plain text:', e);
    }
  }, [content, editor]);

  return editor;
}
