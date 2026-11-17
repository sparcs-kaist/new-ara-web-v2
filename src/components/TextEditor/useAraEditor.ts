'use client';

import { useEffect, useRef } from 'react';
import { useEditor } from '@tiptap/react';
import { createEditorExtensions } from './extensions';
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
    immediatelyRender: false,
    shouldRerenderOnTransaction: true,
    editorProps: {
      attributes: {
        class: className ? `${PROSE_CLASS} ${className}` : PROSE_CLASS,
      },
    },
    extensions: createEditorExtensions({
      placeholder: () => placeholderRef.current,
      onImageError,
    }),
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
          editor.commands.setContent(parsedContent, { emitUpdate: false });
        }
      }
    } catch (e) {
      if (typeof content === 'string' && editor.getText() !== content) {
        editor.commands.setContent(content, { emitUpdate: false });
      }
      console.error('Failed to parse content even after cleaning, treating as plain text:', e);
    }
  }, [content, editor]);

  return editor;
}
