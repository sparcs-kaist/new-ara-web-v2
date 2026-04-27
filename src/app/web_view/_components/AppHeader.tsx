'use client';

import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';

interface AppHeaderProps {
    title?: string;
    leading?: ReactNode;
    trailing?: ReactNode;
    onBack?: () => void;
    showBack?: boolean;
}

export function AppHeader({ title, leading, trailing, onBack, showBack = true }: AppHeaderProps) {
    const router = useRouter();

    const handleBack = () => {
        if (onBack) return onBack();
        if (typeof window !== 'undefined' && window.history.length > 1) {
            router.back();
        }
    };

    return (
        <header className="ara-header">
            <div style={{ width: 36 }}>
                {leading ?? (showBack ? (
                    <button type="button" className="ara-header__btn" onClick={handleBack} aria-label="back">
                        <BackIcon />
                    </button>
                ) : null)}
            </div>
            <h1 className="ara-header__title">{title ?? ''}</h1>
            <div style={{ width: 36, display: 'flex', justifyContent: 'flex-end' }}>{trailing ?? null}</div>
        </header>
    );
}

function BackIcon() {
    return (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
            <path
                d="M12.5 4L6.5 10L12.5 16"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}
