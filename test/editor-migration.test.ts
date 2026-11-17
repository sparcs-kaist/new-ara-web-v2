import { afterEach, describe, expect, it, vi } from 'vitest';
import { Editor, type JSONContent } from '@tiptap/core';
import { createEditorExtensions } from '@/components/TextEditor/extensions';

// Representative stored v2 content, including the app's custom nodes and literal entities.
const storedPost: JSONContent = {
  type: 'doc',
  content: [
    { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '기존 게시글 😀' }] },
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: '한글 &amp; <태그> "인용" ' },
        { type: 'text', marks: [{ type: 'bold' }], text: '굵게' },
        { type: 'text', marks: [{ type: 'italic' }], text: '기울임' },
        { type: 'text', marks: [{ type: 'underline' }], text: '밑줄' },
        { type: 'text', marks: [{ type: 'strike' }], text: '취소선' },
        { type: 'text', marks: [{ type: 'textStyle', attrs: { color: '#ed3a3a' } }], text: '색상' },
        { type: 'hardBreak' },
        {
          type: 'text',
          marks: [{ type: 'link', attrs: { href: 'https://example.com', target: '_blank', rel: 'noopener noreferrer nofollow', class: null } }],
          text: '기존 링크',
        },
      ],
    },
    {
      type: 'paragraph',
      content: [{
        type: 'attachmentImage',
        attrs: { src: 'https://example.com/attachment.png', alt: '첨부 이미지', title: '사진', width: 250, 'data-attachment': '42' },
      }],
    },
    {
      type: 'paragraph',
      content: [{ type: 'linkBookmark', attrs: { href: 'https://example.com/post/1', title: '북마크 제목' } }],
    },
    {
      type: 'bulletList',
      content: [{ type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: '목록' }] }] }],
    },
    { type: 'codeBlock', attrs: { language: 'javascript' }, content: [{ type: 'text', text: 'const value = "&amp;";\n' }] },
  ],
};

const editors: Editor[] = [];
function createEditor(content: JSONContent | string = storedPost) {
  const editor = new Editor({
    element: document.createElement('div'),
    extensions: createEditorExtensions({ placeholder: '내용을 입력하세요' }),
    content,
  });
  editors.push(editor);
  return editor;
}

afterEach(() => {
  editors.splice(0).forEach(editor => editor.destroy());
});

describe('Tiptap 3 compatibility with stored articles', () => {
  it('preserves existing node names, attributes, formatting, and literal text on save and reload', () => {
    const editor = createEditor();
    // v3 adds nullable defaults such as link.title; original data must remain intact.
    expect(editor.getJSON()).toMatchObject(storedPost);
    expect(editor.getJSON().content).toHaveLength(storedPost.content!.length);
    expect(createEditor(JSON.parse(JSON.stringify(editor.getJSON()))).getJSON()).toEqual(editor.getJSON());
  });

  it('preserves custom images, bookmarks, and code when converting through HTML', () => {
    const html = createEditor().getHTML();
    const restored = createEditor(html).getJSON();
    expect(restored.content?.[2]).toEqual(storedPost.content?.[2]);
    expect(restored.content?.[3]).toEqual(storedPost.content?.[3]);
    expect(restored.content?.at(-1)).toEqual(storedPost.content?.at(-1));
  });

  it('does not emit edit events when loading a post or comment', () => {
    const editor = createEditor('');
    const onUpdate = vi.fn();
    editor.on('update', onUpdate);
    editor.commands.setContent(storedPost, { emitUpdate: false });
    expect(onUpdate).not.toHaveBeenCalled();
    expect(editor.getJSON()).toMatchObject(storedPost);
    editor.commands.insertContent('사용자 입력');
    expect(onUpdate).toHaveBeenCalledOnce();
  });

  it('keeps formatting and undo/redo commands usable without duplicate link or underline extensions', () => {
    const editor = createEditor('<p>테스트</p>');
    editor.commands.selectAll();
    editor.chain().toggleBold().toggleUnderline().setLink({ href: 'https://example.com' }).run();
    expect(editor.isActive('bold')).toBe(true);
    expect(editor.isActive('underline')).toBe(true);
    expect(editor.isActive('link')).toBe(true);
    expect(editor.commands.undo()).toBe(true);
    expect(editor.commands.redo()).toBe(true);
    const names = editor.extensionManager.extensions.map(extension => extension.name);
    expect(names.filter(name => name === 'link')).toHaveLength(1);
    expect(names.filter(name => name === 'underline')).toHaveLength(1);
  });
});
