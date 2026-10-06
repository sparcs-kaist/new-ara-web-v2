'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isInShell } from '../_bridge/isInShell';

// Hardware back for shell documents outside /web_view/*, where the layout's handler isn't mounted.
export function ShellBackHandler() {
    const router = useRouter();

    useEffect(() => {
        if (!isInShell()) return;
        let cancelled = false;
        let off: (() => void) | undefined;
        import('../_bridge/client').then(({ getBridge }) => {
            if (cancelled) return;
            off = getBridge().on('back:pressed', () => {
                // The web_view layout owns back on its own routes.
                if (window.location.pathname.startsWith('/web_view')) return;
                if (window.history.length > 1) {
                    router.back();
                    return;
                }
                router.replace('/web_view/Main');
            });
        });
        return () => {
            cancelled = true;
            off?.();
        };
    }, [router]);

    return null;
}
