"use client";

import { ReactNode, useEffect, useState } from "react";
import React from "react";
import "./globals.css";
import NavBar from "@/components/NavBar/NavBar";
import Footer from "@/components/Footer/Footer";
import "@/i18n";
import { fetchMe } from "@/lib/api/user";

export default function RootLayout({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const pathname = typeof window !== "undefined" ? window.location.pathname : "";

  useEffect(() => {
    // /login 페이지에서는 인증 체크하지 않음
    if (pathname === "/login") {
      setIsLoggedIn(false);
      return;
    }

    async function checkAuth() {
      try {
        await fetchMe();
        setIsLoggedIn(true);
      } catch {
        console.error("인증 실패, 로그인 페이지로 리다이렉트합니다.");
        window.location.href = "/login";
      }
    }

    checkAuth();
  }, [pathname]);

  // /login에서는 바로 children 렌더링
  if (pathname === "/login") {
    return (
      <html lang="ko">
        <body className="h-screen">
          <main className="h-full">{children}</main>
        </body>
      </html>
    );
  }

  if (isLoggedIn === null) {
    return (
      <html lang="ko">
        <body><p>로딩 중...</p></body>
      </html>
    );
  }

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
