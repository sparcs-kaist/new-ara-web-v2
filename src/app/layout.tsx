"use client";

import { ReactNode, useEffect, useState } from "react";
import "./globals.css";
import NavBar from "@/components/NavBar/NavBar";
import "@/i18n";

export default function RootLayout({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("https://newara.dev.sparcs.org/api/me", {
          credentials: "include",
        });
        if (!res.ok) throw new Error("Not authenticated");
        setIsLoggedIn(true);
      } catch {
        const handler = window.location.origin + "/auth-handler";
        const next = window.location.origin + "/";
        window.location.href =
          "https://newara.dev.sparcs.org/api/users/sso_login" +
          `?handler=${handler}&next=${next}`;
      }
    }

    checkAuth();
  }, []);

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
      </body>
    </html>
  );
}
