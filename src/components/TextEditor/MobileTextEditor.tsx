'use client';

import './MobileTextEditor.css';
import { forwardRef, useImperativeHandle } from 'react';
import { EditorContent, type Editor } from '@tiptap/react';
import useAraEditor from '@/components/TextEditor/useAraEditor';

interface MobileTextEditorProps {
  content?: string | object;
  placeholder?: string;
}

/**
 * Toolbar-less editor for the app. It grows to fill a flex-column parent and the
 * contenteditable itself covers that area, so one tap anywhere in the body focuses it.
 */
const MobileTextEditor = forwardRef<Editor | null, MobileTextEditorProps>(
  ({ content = '', placeholder = '' }, ref) => {
    const editor = useAraEditor({
      editable: true,
      content,
      placeholder,
      className: 'flex-1 px-[20px] pt-[15px] pb-[60px]',
    });

    useImperativeHandle(ref, () => editor as Editor, [editor]);

    return <EditorContent editor={editor} className="mobile-text-editor editor-content flex flex-1 flex-col" />;
  },
);

MobileTextEditor.displayName = 'MobileTextEditor';
export default MobileTextEditor;
