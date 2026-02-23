const decodeHtmlEntities = (value: string): string => {
    return value
        .replace(/&quot;/g, '"')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>');
};

const normalizeAnchorTagValue = (value: string): string => {
    const hrefMatch = value.match(/href="([^"]+)"/i);
    const textMatch = value.match(/>([\s\S]*?)<\/a>/i);
    return decodeHtmlEntities(textMatch?.[1] ?? hrefMatch?.[1] ?? value);
};

export const cleanJsonString = (jsonStr: string): string => {
    return jsonStr
        .replace(/"(text|href|src)":"<a\b[^>]*>[\s\S]*?<\/a>"/gi, match => {
            const valueMatch = match.match(/"(?:text|href|src)":"([\s\S]*)"$/i);
            const keyMatch = match.match(/^"(text|href|src)":/i);
            const key = keyMatch?.[1] ?? 'text';
            const rawValue = valueMatch?.[1] ?? '';
            const normalizedValue = normalizeAnchorTagValue(rawValue);
            return `"${key}":${JSON.stringify(normalizedValue)}`;
        })
        .replace(/,(\s*[}\]])/g, '$1');
};