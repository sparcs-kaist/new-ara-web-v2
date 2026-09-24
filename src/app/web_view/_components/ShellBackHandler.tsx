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
            off = getBridge().on('back:pressed', (p) => {
                // Replays from before hydration were already handled natively (the shell falls back at 300ms).
                if (p?.ts && Date.now() - p.ts > 150) return;
                if (p?.id != null) getBridge().send('back:handled', { id: p.id });
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
