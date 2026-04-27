'use client';

import { AraLogo, Screen } from '@/app/web_view/_components';

/**
 * SPARCS SSO entry. Mirrors the simple landing of `lib/pages/login_page.dart`:
 * centered ARA logo + a primary CTA button. No shadow, no border around
 * the button (just brand red).
 */
export default function LoginPage() {
    const onSsoLogin = () => {
        const apiHost = process.env.NEXT_PUBLIC_API_HOST || 'https://newara.dev.sparcs.org';
        const next = encodeURIComponent('https://newara.dev.sparcs.org/web_view/Main');
        window.location.href = `${apiHost}/api/users/sso_login/?next=${next}`;
    };

    return (
        <Screen withTabBar={false}>
            <div className="flex min-h-[100dvh] flex-col items-center justify-center px-6">
                <div className="flex-1" />
                <AraLogo width={140} height={76} />
                <div className="mt-3 text-[16px] font-medium text-[#B1B1B1]">
                    KAIST 학생 커뮤니티
                </div>
                <div className="flex-1" />

                <button
                    type="button"
                    onClick={onSsoLogin}
                    className="h-[50px] w-full max-w-[320px] rounded-[10px] bg-ara_red text-[15px] font-bold text-white"
                >
                    SPARCS SSO 로그인
                </button>

                <footer className="mt-8 text-[12px] text-[#B1B1B1]">© SPARCS Ara</footer>
            </div>
        </Screen>
    );
}
