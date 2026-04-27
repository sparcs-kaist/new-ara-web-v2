'use client';

import { useEffect, useRef, useState } from 'react';
import { bridge } from '@/app/web_view/_bridge';

interface MoreButtonProps {
    /** Absolute URL (or path) to share / copy. */
    shareUrl?: string;
    onReport?: () => void;
    onBlock?: () => void;
}

/**
 * Kebab button for the post detail header. Opens a small popover with
 * 신고 / 차단 / 공유 actions. Share goes through the native bridge when
 * available, falling back to clipboard.
 */
export function MoreButton({ shareUrl, onReport, onBlock }: MoreButtonProps) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;
        const handleClick = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [open]);

    const tap = () => {
        try {
            bridge?.send('haptic', { kind: 'light' });
        } catch {
            /* noop */
        }
    };

    const handleShare = async () => {
        tap();
        setOpen(false);
        const url = shareUrl ?? (typeof window !== 'undefined' ? window.location.href : '');
        try {
            // Prefer native share. If unsupported, fall back to clipboard.
            const res = await bridge?.request('share', { url });
            if (res && !res.shared) {
                bridge?.send('clipboardWrite', { text: url });
            }
        } catch {
            try {
                bridge?.send('clipboardWrite', { text: url });
            } catch {
                console.log('[MoreButton] share fallback failed', url);
            }
        }
    };

    const handleReport = () => {
        tap();
        setOpen(false);
        if (onReport) onReport();
        else console.log('[MoreButton] report stub');
    };

    const handleBlock = () => {
        tap();
        setOpen(false);
        if (onBlock) onBlock();
        else console.log('[MoreButton] block stub');
    };

    return (
        <div ref={ref} style={{ position: 'relative' }}>
            <button
                type="button"
                className="ara-header__btn"
                aria-label="more"
                onClick={() => setOpen((v) => !v)}
            >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
                    <circle cx="10" cy="4.5" r="1.5" fill="currentColor" />
                    <circle cx="10" cy="10" r="1.5" fill="currentColor" />
                    <circle cx="10" cy="15.5" r="1.5" fill="currentColor" />
                </svg>
            </button>
            {open && (
                <div
                    role="menu"
                    style={{
                        position: 'absolute',
                        top: 'calc(100% + 4px)',
                        right: 0,
                        minWidth: 140,
                        background: 'var(--ara-bg-elevated)',
                        border: '1px solid var(--ara-divider)',
                        borderRadius: 'var(--ara-radius-md)',
                        boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                        overflow: 'hidden',
                        zIndex: 60,
                    }}
                >
                    <MenuItem label="신고" onClick={handleReport} />
                    <MenuItem label="차단" onClick={handleBlock} />
                    <MenuItem label="공유" onClick={handleShare} />
                </div>
            )}
        </div>
    );
}

function MenuItem({ label, onClick }: { label: string; onClick: () => void }) {
    return (
        <button
            type="button"
            role="menuitem"
            onClick={onClick}
            style={{
                display: 'block',
                width: '100%',
                padding: '10px 14px',
                textAlign: 'left',
                background: 'transparent',
                border: 0,
                fontSize: 14,
                color: 'var(--ara-text-primary)',
                cursor: 'pointer',
            }}
        >
            {label}
        </button>
    );
}
