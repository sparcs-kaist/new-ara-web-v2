import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import { TextStyle } from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Bold from '@tiptap/extension-bold';
import Italic from '@tiptap/extension-italic';
import LinkBookmark from './components/LinkBookmark';
import AttachmentImage from './components/AttachmentImage';
import { CustomCodeBlock } from './components/CodeBlock';

interface EditorExtensionOptions {
  placeholder: string | (() => string);
  onImageError?: () => void;
}

// Keep the document schema identical for posts, comments, and the mobile editor.
export function createEditorExtensions({ placeholder, onImageError }: EditorExtensionOptions) {
  return [
    LinkBookmark,
    AttachmentImage.configure({ errorCallback: onImageError }),
    StarterKit.configure({
      bold: false,
      italic: false,
      codeBlock: false,
      link: false,
      underline: false,
      // Tiptap 3 adds this extension; saved v2 documents must not gain extra paragraphs.
      trailingNode: false,
      heading: { levels: [1, 2, 3] },
    }),
    Underline,
    CustomCodeBlock,
    Link.configure({ openOnClick: false, autolink: false, linkOnPaste: false }),
    Placeholder.configure({ placeholder, showOnlyWhenEditable: true }),
    Italic,
    TextStyle,
    Color.configure({ types: ['textStyle'] }),
    Bold,
  ];
}
