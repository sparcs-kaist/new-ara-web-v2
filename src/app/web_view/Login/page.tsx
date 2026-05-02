'use client';

import { AraLogo, Screen } from '@/app/web_view/_components';
import { getBridge } from '@/app/web_view/_bridge';

/**
 * Faithful port of `lib/pages/login_page.dart`:
 *
 *   ┌──────────────────────────┐
 *   │                          │
 *   │     [ARA logo, 200w]     │  Expanded — fills the top region.
 *   │                          │
 *   │ ┌──────────────────────┐ │  300×60 button, 20px radius, ED3A3A,
 *   │ │  SPARCS SSO로 로그인  │ │  label 18/w500 white.
 *   │ └──────────────────────┘ │
 *   │           50px           │  Fixed bottom gap.
 *   └──────────────────────────┘
 *
 * SSO target uses the page's own origin so dev / prod / preview all work
 * — Flutter goes through SparcsSSOPage; on the web we redirect to the
 * Django SSO endpoint and let it bounce us back to /web_view/Main.
 */
export default function LoginPage() {
    const onSsoLogin = async () => {
        if (typeof window === 'undefined') return;

        // Mirror Flutter's `WebViewCookieManager().clearCookies()` in
        // SparcsSSOPage.initState — without it, a stale Django session
        // cookie + a fresh `state` parameter from sso_login disagree at
        // sso_login_callback, and the WebView lands on the Django 401
        // error page instead of bouncing back to /auth-handler. Best
        // effort: in browser dev mode the bridge isn't connected and
        // `request` rejects immediately, which we swallow.
        try {
            await getBridge().request('clearSession');
        } catch {
            /* not running inside native shell, or native cleared via fallback */
        }

        const apiHost =
            process.env.NEXT_PUBLIC_API_HOST?.replace(/\/$/, '') ||
            window.location.origin;
        // Mirror the desktop /login flow: SSO bounces back to the
        // shared `/auth-handler` page (which exchanges code → session
        // and then routes to `link`). Passing `next=/web_view/Main`
        // makes that final hop land us back inside the shell.
        const origin = window.location.origin;
        const handler = `${origin}/auth-handler`;
        const next = `${origin}/web_view/Main`;
        window.location.href =
            `${apiHost}/api/users/sso_login?handler=${encodeURIComponent(handler)}` +
            `&next=${encodeURIComponent(next)}`;
    };

    return (
        <Screen withTabBar={false}>
            <div className="flex flex-1 flex-col items-center px-6">
                <div className="flex w-full flex-1 items-center justify-center">
                    <AraLogo width={200} height={109} />
                </div>
                <button
                    type="button"
                    onClick={onSsoLogin}
                    className="flex h-[60px] w-[300px] items-center justify-center rounded-[20px] bg-ara_red text-[18px] font-medium text-white"
                >
                    SPARCS SSO로 로그인
                </button>
                <div className="h-[50px]" />
            </div>
        </Screen>
    );
}
