'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';

/**
 * `router.back()` is a no-op when the WebView was opened to a deep link
 * (no SPA history to pop) — it leaves the user looking at a back arrow
 * that does nothing. Mirror Flutter's `Navigator.canPop()` fallback by
 * sending them to `/web_view/Main` instead.
 */
export function useSafeBack() {
    const router = useRouter();
    return useCallback(() => {
        if (typeof window !== 'undefined' && window.history.length > 1) {
            router.back();
            return;
        }
        router.replace('/web_view/Main');
    }, [router]);
}
