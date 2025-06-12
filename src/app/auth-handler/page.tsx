"use client";
import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function AuthHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const stateFromQuery = searchParams.get("state");
    const code = searchParams.get("code");
    const link = searchParams.get("link");

    // state 쿠키 검증 로직 제거

    // 서버로 code, state 전달
    fetch(`/api/users/sso_login_callback/?code=${encodeURIComponent(code ?? "")}&state=${encodeURIComponent(stateFromQuery ?? "")}`, {
      credentials: "include",
    })
      .then(async (res) => {
        if (!res.ok) {
          alert("서버 인증 실패");
          router.replace("/");
          return;
        }
        // 인증 성공 처리 (예: setAuthState(true))
        // setAuthState(true);

        // 원래 경로로 이동
        if (link) {
          const host = window.location.protocol + "//" + window.location.host;
          const path = link.startsWith(host) ? link.substring(host.length) : link;
          router.replace(path || "/");
        } else {
          router.replace("/");
        }
      });
  }, [router, searchParams]);

  return <div>로그인 처리 중...</div>;
}