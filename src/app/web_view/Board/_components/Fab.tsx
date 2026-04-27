'use client';

import Link from 'next/link';
import { bridge } from '@/app/web_view/_bridge';

interface FabProps {
    href: string;
    label?: string;
    aboveTabBar?: boolean;
}

/**
 * Floating action button (bottom-right). Used for "글 쓰기" entry points.
 * Sits above the safe area and (optionally) above the bottom tab bar.
 */
export function Fab({ href, label = '글 쓰기', aboveTabBar = true }: FabProps) {
    return (
        <Link
            href={href}
            onClick={() => {
                try {
                    bridge?.send('haptic', { kind: 'light' });
                } catch {
                    /* no-op in browser */
                }
            }}
            aria-label={label}
            style={{
                position: 'fixed',
                right: 'calc(var(--ara-spacing-lg) + var(--ara-safe-right))',
                bottom: aboveTabBar
                    ? 'calc(var(--ara-tab-height) + var(--ara-safe-bottom) + var(--ara-spacing-lg))'
                    : 'calc(var(--ara-safe-bottom) + var(--ara-spacing-lg))',
                width: 56,
                height: 56,
                borderRadius: 999,
                background: 'var(--ara-primary)',
                color: 'var(--ara-text-on-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 6px 16px rgba(237, 58, 58, 0.35)',
                zIndex: 30,
                textDecoration: 'none',
            }}
        >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path
                    d="M4 20L4 17L15 6L18 9L7 20L4 20Z"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinejoin="round"
                />
                <path
                    d="M14 7L17 10"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                />
            </svg>
        </Link>
    );
}
