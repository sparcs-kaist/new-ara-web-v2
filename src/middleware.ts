import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // API, auth-handler, login 경로는 인증 예외 처리
  if (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/auth-handler") ||
    pathname.startsWith("/login")
  ) {
    return NextResponse.next();
  }

  // 세션 쿠키명(예: 'sessionid')에 맞게 수정
  const session = request.cookies.get("sessionid");

  if (!session) {
    // 현재 요청의 전체 URL
    const originalUrl = `${request.nextUrl.protocol}//${request.nextUrl.host}${pathname}${search}`;
    // SSO 로그인 URL에 handler와 next 파라미터를 모두 추가
    const ssoLoginUrl = new URL("https://migration.newara.dev.sparcs.org/api/users/sso_login");
    ssoLoginUrl.searchParams.set("handler", `${request.nextUrl.protocol}//${request.nextUrl.host}/auth-handler`);
    ssoLoginUrl.searchParams.set("next", originalUrl);
    return NextResponse.redirect(ssoLoginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/:path*"],
};