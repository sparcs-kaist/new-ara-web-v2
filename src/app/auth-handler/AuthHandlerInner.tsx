"use client";
import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { queryClient } from "@/lib/queryClient";

export default function AuthHandlerInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const stateFromQuery = searchParams.get("state");
    const code = searchParams.get("code");
    const link = searchParams.get("link");

    fetch(
      `/api/users/sso_login_callback/?code=${encodeURIComponent(code ?? "")}&state=${encodeURIComponent(stateFromQuery ?? "")}`,
      {
        credentials: "include",
      },
    ).then(async (res) => {
      if (!res.ok) {
        // In the WebView shell this happens when a stale Django session
        // cookie survives across logins and disagrees with the fresh
        // `state` we just got from sso_login. Ask the bridge to clear
        // cookies and bounce back to the in-app login screen so the
        // user can retry without seeing the Django 401 page.
        const inWebView =
          typeof window !== "undefined" &&
          window.location.pathname.startsWith("/auth-handler") &&
          /AraNative/.test(navigator.userAgent ?? "");
        try {
          const { getBridge } = await import("@/app/web_view/_bridge");
          await getBridge().request("clearSession");
        } catch {
          /* browser mode or bridge unreachable */
        }
        if (inWebView) {
          router.replace("/web_view/Login");
        } else {
          alert("서버 인증 실패");
          router.replace("/");
        }
        return;
      }
      queryClient.removeQueries({ queryKey: ["me"] });

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
