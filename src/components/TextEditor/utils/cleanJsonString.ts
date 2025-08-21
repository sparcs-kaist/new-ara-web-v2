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