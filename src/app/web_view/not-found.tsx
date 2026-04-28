'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Screen } from '@/app/web_view/_components';

/**
 * Catches unmatched routes under /web_view/* so the WebView never falls
 * through to the desktop-web `app/not-found.tsx` (which paints a 800×450
 * marketing 404 image meant for the laptop site).
 *
 * We send the user back to /web_view/Main on the next tick — the splash is
 * just there to avoid a blank flash if the navigation is slow.
 */
export default function WebViewNotFound() {
    const router = useRouter();
    useEffect(() => {
        const t = setTimeout(() => router.replace('/web_view/Main'), 0);
        return () => clearTimeout(t);
    }, [router]);
    return (
        <Screen withTabBar={false}>
            <div className="flex min-h-[100dvh] items-center justify-center text-[14px] text-[#B1B1B1]">
                이동 중...
            </div>
        </Screen>
    );
}
