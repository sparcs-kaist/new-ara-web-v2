import assert from 'node:assert/strict';
import test from 'node:test';
import { parseEditorContent } from '../src/components/TextEditor/utils/parseEditorContent.ts';

const document = text => ({
    type: 'doc',
    content: [{ type: 'paragraph', content: [{ type: 'text', text }] }],
});

test('native JSON text keeps angle brackets and intentional entity spellings', () => {
    const doc = document('<Perception> &lt;literal&gt; &amp;lt; &#60; &amp');
    assert.deepEqual(parseEditorContent(JSON.stringify(doc)), doc);
    assert.deepEqual(parseEditorContent(doc), doc);
});

test('API storage version is removed without mutating the response', () => {
    const doc = { ...document('text'), ara_format: 'ara-tiptap-v1' };
    const before = structuredClone(doc);
    assert.deepEqual(parseEditorContent(doc), document('text'));
    assert.deepEqual(doc, before);
});

test('HTML is passed to the HTML parser without an extra decoding pass', () => {
    const html = '<p>&lt;Perception&gt; &amp;lt; <strong>서식</strong></p>';
    assert.equal(parseEditorContent(html), html);
});

test('link URLs, formatting and code text stay untouched', () => {
    const doc = document('link');
    doc.content[0].content[0].marks = [{ type: 'link', attrs: { href: 'https://example.com/?a=1&b=2' } }];
    doc.content.push({ type: 'codeBlock', content: [{ type: 'text', text: '<a>&lt;</a>' }] });
    assert.deepEqual(parseEditorContent(JSON.stringify(doc)), doc);
});

test('empty content and ordinary JSON text are preserved', () => {
    for (const value of ['', '{"message":"hello"}', '[1,2]', '"quoted"']) {
        assert.equal(parseEditorContent(value), value);
    }
});
