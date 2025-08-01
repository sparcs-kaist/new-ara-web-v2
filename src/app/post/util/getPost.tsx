// JSON 문자열 정리 함수
export const cleanJsonString = (jsonStr: string): string => {
  return jsonStr
    // HTML 태그가 포함된 href 값 정리 - 더 정확한 패턴
    .replace(/"href":"<a href="([^"]+)"[^>]*>\1<\/a>"/g, '"href":"$1"')
    // HTML 태그가 포함된 src 값 정리 - 더 정확한 패턴
    .replace(/"src":"<a href="([^"]+)"[^>]*>\1<\/a>"/g, '"src":"$1"')
    // 일반적인 HTML 태그 제거 (백업용)
    .replace(/"(href|src)":"<[^>]*>([^<]+)<\/[^>]*>"/g, '"$1":"$2"')
    // 기타 HTML 엔티티 정리
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    // 잘못된 콤마나 따옴표 정리
    .replace(/,(\s*[}\]])/g, '$1')  // 마지막 콤마 제거
    // 이스케이프되지 않은 따옴표 처리
    .replace(/([^\\])"([^",:}\]]*)"([^",:}\]]*)"([^,:}\]]*)/g, '$1"$2\\"$3\\"$4')
};

// @ts-expect-error : temporary fix the build error to make dev server work
// data format을 any로 설정할 수 있게 하기 위함
export function formatPost({data}) : PostData {
    console.log(data);
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