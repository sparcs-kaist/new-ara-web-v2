import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // SSO 로그인 페이지만 예외 처리 (필요시 추가)
  if (pathname.startsWith("/login")) {
    return NextResponse.next();
  }

  // 세션 쿠키명(예: 'sid')에 맞게 수정
  const session = request.cookies.get("sid");

  if (!session) {
    // SSO 로그인 URL로 리다이렉트, next 파라미터로 원래 경로 전달
    const ssoLoginUrl = new URL("https://newara.dev.sparcs.org/api/users/sso_login");
    ssoLoginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(ssoLoginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/:path*"], // 전체 경로에 적용
};