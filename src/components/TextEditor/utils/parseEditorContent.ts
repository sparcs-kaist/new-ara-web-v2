import type { JSONContent } from '@tiptap/core';

/** The API returns either native TipTap JSON or a legacy HTML document. */
export function parseEditorContent(content: string | object): JSONContent | string {
    let document: unknown = content;
    if (typeof content === 'string') {
        try {
            document = JSON.parse(content);
        } catch {
            return content;
        }
    }

    if (document && typeof document === 'object' && 'type' in document && document.type === 'doc') {
        const parsed = { ...document } as JSONContent;
        // This storage version belongs to the API, not the editor schema.
        delete parsed.ara_format;
        return parsed;
    }

    return typeof content === 'string' ? content : '';
}
