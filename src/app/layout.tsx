import { ReactNode } from "react";
import "./globals.css";
import NavBar from "@/components/NavBar/NavBar";
import "@/i18n";

export default function RootLayout({ children }: { children: ReactNode }) {
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