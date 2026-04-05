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

// JSON 문자열 정리 함수
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

// @ts-expect-error : temporary fix the build error to make dev server work
// data format을 any로 설정할 수 있게 하기 위함
export function formatPost({ data }): PostData {
    // console.log(data);
    let processedContent = data.content;

    if (typeof data.content === 'string') {
        const trimmed = data.content.trim();

        // JSON 형태인지 확인 ('{' 로 시작)
        if (trimmed.startsWith('{')) {
            try {
                // 1차: 그대로 파싱 시도
                processedContent = JSON.parse(trimmed);
                console.log('Content loaded as JSON from string');
            } catch (firstErr) {
                try {
                    // 2차: HTML 디코딩 후 파싱 시도
                    const textarea = document.createElement('textarea');
                    textarea.innerHTML = trimmed;
                    const decodedContent = textarea.value;
                    // 강력한 JSON 정리
                    const cleanedContent = cleanJsonString(decodedContent);
                    console.log('Cleaned JSON:', cleanedContent.substring(1700, 1800)); // 에러 지점 근처 확인
                    processedContent = JSON.parse(cleanedContent);
                    console.log('Content loaded as JSON after HTML decoding');
                } catch (secondErr) {
                    console.log('All JSON parse attempts failed, treating as HTML:', firstErr, secondErr);
                    processedContent = data.content; // 원본 HTML 유지
                }
            }
        } else {
            // HTML 형태
            console.log('Content loaded as HTML');
            processedContent = data.content;
        }
    } else if (typeof data.content === 'object' && data.content !== null) {
        // 이미 파싱된 JSON 객체
        console.log('Content is already parsed JSON object');
        processedContent = data.content;
    }

    return ({
        ...data,
        content: processedContent
    });
}