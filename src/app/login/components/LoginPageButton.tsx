//LoginPageButton.tsx
//로그인 페이지에서 공통적으로 사용되는 버튼 컴포넌트

"use client";

import Link from "next/link";
import { ReactNode } from "react";

interface LoginPageButtonProps {
    icon ?: ReactNode | null;
    fontSize ?: number; // px 단위
    redirectUrl : string;
    children : string; // Text inside the button
}

export default function LoginPageButton({
  icon = null,
  fontSize = 16,
  redirectUrl,
  children,
}: LoginPageButtonProps) {
  return (
    <Link
      href={redirectUrl}
      className={`
        inline-flex items-center justify-center gap-2 px-4 py-2
        rounded-lg bg-white text-[#ed3a3a] border border-[#dbdbdb]
        font-normal transition-shadow duration-300
        hover:shadow-[0_2px_6px_0_#d1d5db]
        text-[${fontSize}px]
      `}
    >
      {icon && <span>{icon}</span>}
      {children}
    </Link>
  );
}