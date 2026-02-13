"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useMe } from "@/lib/query/user";
import NavBar from "@/components/NavBar/NavBar";
import Footer from "@/components/Footer/Footer";
import "./globals.css";

const queryClient = new QueryClient();

export default function RootLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <QueryClientProvider client={queryClient}>
      <AuthWrapper pathname={pathname}>{children}</AuthWrapper>
    </QueryClientProvider>
  );
}

// 인증 체크 + 렌더링을 분리
function AuthWrapper({ pathname, children }: { pathname: string; children: ReactNode }) {
  // /login 페이지는 인증 체크 필요 없음
  if (pathname === "/login") {
    return (
      <html lang="ko">
        <body className="h-screen">
          <main className="h-full">{children}</main>
        </body>
      </html>
    );
  }

  const { data: me, isLoading, isError } = useMe();

  if (isLoading) {
    return (
      <html lang="ko">
        <body>
          <p>로딩 중...</p>
        </body>
      </html>
    );
  }

  if (isError || !me) {
    // 인증 실패 → 로그인 페이지로 리다이렉트
    if (typeof window !== "undefined") window.location.href = "/login";
    return null;
  }

  // WebView 페이지 : NavBar와 Footer 제외
  if (pathname.startsWith("/web_view")) {
    return (
      <html lang="ko">
        <head>
          <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet" />
        </head>
        <body className="h-screen">
          <main className="h-full">{children}</main>
        </body>
      </html>
    );
  }

  // 채팅 페이지 : Footer 제외
  if (pathname.startsWith("/chat")) {
    return (
      <html lang="ko">
        <head>
          <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet" />
        </head>
        <body className="h-screen">
          <NavBar />
          <main>{children}</main>
        </body>
      </html>
    );
  }

  // 일반 페이지 : NavBar + Footer
  return (
    <html lang="ko">
      <head>
        <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet" />
      </head>
      <body>
        <NavBar />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
