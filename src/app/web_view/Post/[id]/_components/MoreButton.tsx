'use client';

import { useEffect, useRef, useState } from 'react';
import { MoreIcon } from '@/app/web_view/_components';

interface MoreButtonProps {
    /** Absolute URL (or path) to share / copy. */
    shareUrl?: string;
    onReport?: () => void;
    onBlock?: () => void;
}

/**
 * Kebab button for the post detail header. Opens a small popover with
 * 신고 / 차단 / 공유 actions. Only used as a fallback affordance — the
 * full action set lives in `UtilityButtons` underneath the article body.
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

    const handleShare = async () => {
        setOpen(false);
        const url = shareUrl ?? (typeof window !== 'undefined' ? window.location.href : '');
        try {
            if (typeof navigator !== 'undefined' && navigator.share) {
                await navigator.share({ url });
                return;
            }
        } catch {
            /* fall through */
        }
        if (typeof navigator !== 'undefined' && navigator.clipboard) {
            try {
                await navigator.clipboard.writeText(url);
            } catch {
                /* noop */
            }
        }
    };

    return (
        <div ref={ref} className="relative">
            <button
                type="button"
                aria-label="더보기"
                onClick={() => setOpen((v) => !v)}
                className="flex h-11 w-11 items-center justify-center bg-transparent text-black"
            >
                <MoreIcon size={20} />
            </button>
            {open && (
                <div
                    role="menu"
                    className="absolute right-0 top-full mt-1 min-w-[140px] overflow-hidden rounded-[10px] border border-[#F0F0F0] bg-white"
                >
                    <MenuItem
                        label="신고"
                        onClick={() => {
                            setOpen(false);
                            onReport?.();
                        }}
                    />
                    <MenuItem
                        label="차단"
                        onClick={() => {
                            setOpen(false);
                            onBlock?.();
                        }}
                    />
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
            className="block w-full bg-transparent px-[14px] py-[10px] text-left text-[14px] text-black"
        >
            {label}
        </button>
    );
}
