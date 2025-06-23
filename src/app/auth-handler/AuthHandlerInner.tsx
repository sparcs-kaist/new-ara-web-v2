"use client";
import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function AuthHandlerInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const stateFromQuery = searchParams.get("state");
    const code = searchParams.get("code");
    const link = searchParams.get("link");

    fetch(`/api/users/sso_login_callback/?code=${encodeURIComponent(code ?? "")}&state=${encodeURIComponent(stateFromQuery ?? "")}`, {
      credentials: "include",
    })
      .then(async (res) => {
        if (!res.ok) {
          alert("서버 인증 실패");
          router.replace("/");
          return;
        }
        if (link) {
          const host = window.location.protocol + "//" + window.location.host;
          const path = link.startsWith(host) ? link.substring(host.length) : link;
          router.replace(path || "/");
        } else {
          router.replace("/");
        }
      });

    fetch("/api/me", { credentials: "include" })
      .then(res => res.json())
      .then(data => console.log("me API result:", data));
  }, [router, searchParams]);

  return <div>로그인 처리 중...</div>;
}