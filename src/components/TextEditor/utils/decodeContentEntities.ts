import type { JSONContent } from '@tiptap/core';

/** Decode API-escaped text after JSON parsing, without interpreting it as HTML. */
export function decodeContentEntities(content: JSONContent): JSONContent {
    const decoder = document.createElement('textarea');

    const visit = (node: JSONContent): JSONContent => ({
        ...node,
        ...(node.type === 'text' && typeof node.text === 'string'
            ? {
                text: node.text.replace(/&(?:#\d+|#x[\da-f]+|[a-z][\da-z]*);/gi, entity => {
                    // Decode one entity at a time so literal tags stay text and
                    // nested escapes are only decoded once.
                    decoder.innerHTML = entity;
                    return decoder.value;
                }),
            }
            : {}),
        ...(node.content ? { content: node.content.map(visit) } : {}),
    });

    return visit(content);
}
