'use client';

import { useEffect, useRef, useState, type TouchEvent, type TransitionEvent } from 'react';

const SHOW_MS = 4000;
const HIDDEN = 'translateY(calc(-100% - var(--ara-safe-top) - 8px))';

export interface PushBannerContent {
    id: number;
    title: string;
    body?: string;
    to?: string;
}

export function PushBanner({
    banner,
    onOpen,
    onDone,
}: {
    banner: PushBannerContent;
    onOpen: (to: string) => void;
    onDone: () => void;
}) {
    const [shown, setShown] = useState(false);
    const [dragY, setDragY] = useState(0);
    const drag = useRef({ startY: 0, moved: false });

    // A newer push swaps the text in place and restarts the timer.
    useEffect(() => {
        let inner = 0;
        const outer = requestAnimationFrame(() => {
            inner = requestAnimationFrame(() => setShown(true));
        });
        const hide = window.setTimeout(() => setShown(false), SHOW_MS);
        return () => {
            cancelAnimationFrame(outer);
            cancelAnimationFrame(inner);
            window.clearTimeout(hide);
        };
    }, [banner.id]);

    const onTouchStart = (e: TouchEvent) => {
        drag.current = { startY: e.touches[0].clientY, moved: false };
    };
    const onTouchMove = (e: TouchEvent) => {
        const dy = e.touches[0].clientY - drag.current.startY;
        if (Math.abs(dy) > 8) drag.current.moved = true;
        setDragY(Math.min(0, dy));
    };
    const onTouchEnd = () => {
        if (dragY < -24) setShown(false);
        setDragY(0);
    };
    const onClick = () => {
        if (drag.current.moved) return;
        if (banner.to) onOpen(banner.to);
        setShown(false);
    };
    const onTransitionEnd = (e: TransitionEvent) => {
        if (e.target === e.currentTarget && e.propertyName === 'transform' && !shown) onDone();
    };

    return (
        <div
            role="status"
            aria-live="polite"
            className={`fixed inset-x-3 z-[90] touch-none ${dragY ? '' : 'transition-transform duration-[250ms] ease-out'}`}
            style={{ top: 'calc(var(--ara-safe-top) + 8px)', transform: shown ? `translateY(${dragY}px)` : HIDDEN }}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            onTouchCancel={onTouchEnd}
            onTransitionEnd={onTransitionEnd}
        >
            <button
                type="button"
                onClick={onClick}
                className="block w-full rounded-[12px] bg-white px-4 py-3 text-left shadow-[0_4px_20px_rgba(0,0,0,0.12)]"
            >
                <span className="block truncate text-[14px] font-semibold text-black">{banner.title}</span>
                {banner.body && <span className="mt-0.5 block truncate text-[13px] text-[#646464]">{banner.body}</span>}
            </button>
        </div>
    );
}
