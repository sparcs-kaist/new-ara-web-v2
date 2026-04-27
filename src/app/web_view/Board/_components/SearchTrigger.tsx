'use client';

import { useRouter } from 'next/navigation';

interface SearchTriggerProps {
    /** Where to push when tapped. */
    target?: string;
    placeholder?: string;
}

/**
 * Read-only-looking search bar that pushes to a real search screen on tap.
 * Used at the top of the Board directory.
 */
export function SearchTrigger({
    target = '/web_view/Search',
    placeholder = '게시판 / 게시글 검색',
}: SearchTriggerProps) {
    const router = useRouter();
    return (
        <button
            type="button"
            onClick={() => router.push(target)}
            style={{
                margin: 'var(--ara-spacing-sm) var(--ara-spacing-lg) var(--ara-spacing-md)',
                padding: '10px 14px',
                width: 'calc(100% - 2 * var(--ara-spacing-lg))',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: 'var(--ara-bg-muted)',
                border: 0,
                borderRadius: 999,
                color: 'var(--ara-text-tertiary)',
                fontSize: 14,
                cursor: 'pointer',
                textAlign: 'left',
            }}
        >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                <circle cx="11" cy="11" r="6" stroke="currentColor" strokeWidth="1.8" />
                <path
                    d="M20 20L16 16"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                />
            </svg>
            <span>{placeholder}</span>
        </button>
    );
}

export function SearchIconButton({ onClick }: { onClick: () => void }) {
    return (
        <button
            type="button"
            aria-label="검색"
            onClick={onClick}
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
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
                <circle cx="11" cy="11" r="6" stroke="currentColor" strokeWidth="1.8" />
                <path
                    d="M20 20L16 16"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                />
            </svg>
        </button>
    );
}
