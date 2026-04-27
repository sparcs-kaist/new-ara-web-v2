'use client';

import { useRouter } from 'next/navigation';
import type { MouseEvent, ReactNode } from 'react';
import { bridge } from '@/app/web_view/_bridge';

interface ContentAreaProps {
    children: ReactNode;
    className?: string;
}

const SAME_ORIGIN_PREFIX = '/web_view/';

/**
 * Wraps user-generated content (post bodies, comments, notification rows)
 * and intercepts native anchor clicks so the WebView never navigates off
 * the SPA scope.
 *
 *   mailto: / tel: / sms:    → let the browser handle it (native pickers).
 *   /web_view/*              → routed through Next.js client navigation.
 *   anything else            → forwarded to the native shell via the
 *                              `openExternal` bridge command, with a
 *                              `window.open` fallback when the bridge is
 *                              unavailable (browser preview, dev).
 *
 * Without this guard, a TipTap-rendered <a href="https://…"> would replace
 * the entire WebView document on click, falling out of /web_view/* — that
 * showed up as the desktop main page leaking through.
 */
export function ContentArea({ children, className }: ContentAreaProps) {
    const router = useRouter();

    const onClick = (e: MouseEvent<HTMLDivElement>) => {
        const target = e.target as HTMLElement | null;
        if (!target) return;
        const anchor = target.closest('a') as HTMLAnchorElement | null;
        if (!anchor) return;
        const rawHref = anchor.getAttribute('href');
        if (!rawHref) return;

        // Plain in-page anchors and protocol handlers — let the browser run.
        if (
            rawHref.startsWith('#') ||
            rawHref.startsWith('mailto:') ||
            rawHref.startsWith('tel:') ||
            rawHref.startsWith('sms:')
        ) {
            return;
        }

        e.preventDefault();
        e.stopPropagation();

        if (rawHref.startsWith(SAME_ORIGIN_PREFIX)) {
            router.push(rawHref);
            return;
        }

        // Resolve relative URLs against the page so the bridge always gets
        // an absolute string.
        let absolute = rawHref;
        try {
            absolute = new URL(rawHref, window.location.href).toString();
            if (absolute.startsWith(window.location.origin + SAME_ORIGIN_PREFIX)) {
                router.push(absolute.slice(window.location.origin.length));
                return;
            }
        } catch {
            /* leave rawHref as-is and try the bridge with whatever we have */
        }

        try {
            bridge?.send('openExternal', { url: absolute });
            return;
        } catch {
            /* fall through to window.open */
        }
        window.open(absolute, '_blank', 'noopener,noreferrer');
    };

    return (
        <div className={className} onClick={onClick}>
            {children}
        </div>
    );
}
