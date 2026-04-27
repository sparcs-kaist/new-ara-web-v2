'use client';

import { useRouter } from 'next/navigation';

/**
 * Custom large header for the Main (Home) tab. No back button — this is a
 * tab root. Renders the "ARA" wordmark in brand red and a bell icon that
 * navigates to the Notifications tab.
 */
export function HomeHeader() {
    const router = useRouter();

    return (
        <header
            style={{
                position: 'sticky',
                top: 0,
                zIndex: 40,
                background: 'var(--ara-bg)',
                borderBottom: '1px solid var(--ara-divider)',
                padding: '12px var(--ara-spacing-lg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
            }}
        >
            <h1
                style={{
                    margin: 0,
                    color: 'var(--ara-primary)',
                    fontSize: 24,
                    fontWeight: 700,
                    letterSpacing: 0.5,
                }}
            >
                ARA
            </h1>
            <button
                type="button"
                aria-label="알림"
                onClick={() => router.push('/web_view/Notifications')}
                style={{
                    width: 36,
                    height: 36,
                    background: 'transparent',
                    border: 0,
                    color: 'var(--ara-text-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                }}
            >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path
                        d="M6 16V11C6 7.68629 8.68629 5 12 5C15.3137 5 18 7.68629 18 11V16L20 18H4L6 16Z"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinejoin="round"
                    />
                    <path
                        d="M10 21H14"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                    />
                </svg>
            </button>
        </header>
    );
}
