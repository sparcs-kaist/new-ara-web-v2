"use client";

import { ReactNode, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import React from "react";
import "./globals.css";
import NavBar from "@/components/NavBar/NavBar";
import Footer from "@/components/Footer/Footer";
import "@/i18n";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { fetchMe } from "@/lib/api/user";

export default function RootLayout({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const pathname = usePathname();

  // Vue -> Next.js 마이그레이션 : Vue의 Service Worker가 남아 있는 문제가 있음
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => {
          registration.unregister();
        });
      });
    }
  }, []);

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
          <div className="flex items-center justify-center min-h-screen">
            <div className="w-10 h-10 border-4 border-[#ed3a3a]/30 border-t-[#ed3a3a] rounded-full animate-spin" />
          </div>
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
        <link
          href="https://fonts.googleapis.com/icon?family=Material+Icons"
          rel="stylesheet"
        />
      </head>
      <body className="h-screen">{renderContent()}</body>
    </html>
  );
}
