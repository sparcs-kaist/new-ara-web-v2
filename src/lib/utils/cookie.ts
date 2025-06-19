/**
 * 클라이언트 측에서 특정 쿠키 값을 가져온다.
 * SSR 환경에서는 항상 null을 반환함.
 */
export function getCookie(name: string): string | null {
  if (typeof document === 'undefined' || !document.cookie) {
    return null;
  }

  for (const cookieRaw of document.cookie.split(';')) {
    const cookieText = cookieRaw.trim();
    if (cookieText.startsWith(`${name}=`)) {
      return decodeURIComponent(cookieText.substring(name.length + 1));
    }
  }

  return null;
}