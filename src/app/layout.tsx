'use client';

import { ReactNode, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import React from "react";
import "./globals.css";
import NavBar from "@/components/NavBar/NavBar";
import Footer from "@/components/Footer/Footer";
import "@/i18n";
import { fetchMe } from "@/lib/api/user";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";

export default function RootLayout({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const pathname = usePathname();

  useEffect(() => {
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

  const renderContent = () => {
    if (pathname === "/login") {
      return (
        <QueryClientProvider client={queryClient}>
          <main className="h-full">{children}</main>
        </QueryClientProvider>
      );
    }

    if (isLoggedIn === null) {
      return (
        <QueryClientProvider client={queryClient}>
          <p>로딩 중...</p>
        </QueryClientProvider>
      );
    }

    if (pathname.startsWith("/web_view")) {
      return <main className="h-full">{children}</main>;
    }

    if (pathname.startsWith("/chat")) {
      return (
        <QueryClientProvider client={queryClient}>
          <NavBar />
          <main>{children}</main>
        </QueryClientProvider>
      );
    }

    return (
      <QueryClientProvider client={queryClient}>
        <NavBar />
        <main>{children}</main>
        <Footer />
      </QueryClientProvider>
    );
  };

  return (
    <html lang="ko">
      <head>
        <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet" />
      </head>
      <body className="h-screen">
        {renderContent()}
      </body>
    </html>
  );
}
