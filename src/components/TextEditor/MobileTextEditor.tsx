'use client';

import './MobileTextEditor.css';
import { forwardRef, useEffect, useImperativeHandle } from 'react';
import { EditorContent, type Editor } from '@tiptap/react';
import useAraEditor from '@/components/TextEditor/useAraEditor';

interface MobileTextEditorProps {
  content?: string | object;
  placeholder?: string;
  bottomInset?: number;
}

// The contenteditable fills the flex parent, so one tap anywhere in the body focuses it.
const MobileTextEditor = forwardRef<Editor | null, MobileTextEditorProps>(
  ({ content = '', placeholder = '', bottomInset = 0 }, ref) => {
    const editor = useAraEditor({
      editable: true,
      content,
      placeholder,
      className: 'flex-1 px-[20px] pt-[15px] pb-[60px]',
    });

    // ProseMirror scrolls the caret only to the viewport edge, which a fixed bottom bar covers.
    useEffect(() => {
      editor?.view.setProps({
        scrollThreshold: { top: 0, right: 0, bottom: bottomInset, left: 0 },
        scrollMargin: { top: 5, right: 5, bottom: bottomInset + 10, left: 5 },
      });
    }, [editor, bottomInset]);

    useImperativeHandle(ref, () => editor as Editor, [editor]);

    return <EditorContent editor={editor} className="mobile-text-editor editor-content flex flex-1 flex-col" />;
  },
);

MobileTextEditor.displayName = 'MobileTextEditor';
export default MobileTextEditor;
