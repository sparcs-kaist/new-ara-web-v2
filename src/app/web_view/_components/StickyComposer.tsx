'use client';

import { useEffect, useRef, type ReactNode } from 'react';

interface StickyComposerProps {
    children: ReactNode;
    /** Reserve space for the bottom tab bar in addition to safe area / keyboard. */
    aboveTabBar?: boolean;
    className?: string;
}

// Home-indicator clearance handed off to the keyboard continuously: the
// resting offset gives way px-for-px as the layout viewport shrinks.
const CLOSED_RESTING_OFFSET =
    'max(0px, calc(var(--ara-safe-bottom, env(safe-area-inset-bottom, 0px)) - var(--ara-kb-shrink, 0px)))';

/**
 * Bottom-anchored bar that auto-lifts above the keyboard (safe area when
 * closed, flush when open). Stays pure CSS — React state or a bottom
 * transition adds a one-frame mismatch. Publishes `--ara-composer-h`.
 */
export function StickyComposer({ children, aboveTabBar = false, className }: StickyComposerProps) {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const el = ref.current;
        if (!el || typeof ResizeObserver === 'undefined') return;
        const ro = new ResizeObserver(() => {
            document.documentElement.style.setProperty('--ara-composer-h', `${el.offsetHeight}px`);
        });
        ro.observe(el);
        return () => {
            ro.disconnect();
            document.documentElement.style.removeProperty('--ara-composer-h');
        };
    }, []);

    return (
        <div
            ref={ref}
            className={[
                'fixed inset-x-0 z-[45] bg-white border-t border-[#F0F0F0]',
                className ?? '',
            ]
                .filter(Boolean)
                .join(' ')}
            style={{
                bottom: aboveTabBar
                    ? `calc(max(var(--kb-inset, 0px), ${CLOSED_RESTING_OFFSET}) + 50px)`
                    : `max(var(--kb-inset, 0px), ${CLOSED_RESTING_OFFSET})`,
                paddingLeft: 'var(--ara-safe-left, env(safe-area-inset-left, 0px))',
                paddingRight: 'var(--ara-safe-right, env(safe-area-inset-right, 0px))',
            }}
        >
            {children}
        </div>
    );
}

/**
 * Spacer that keeps the last list item from sitting under the composer,
 * sized from the composer's measured height; `height` is the
 * pre-measurement fallback.
 */
export function ComposerSpacer({ height = 96, aboveTabBar = false }: { height?: number; aboveTabBar?: boolean }) {
    // No safe-bottom term: Screen's own paddingBottom already reserves it;
    // adding it here double-counted the inset as a visible gap.
    const base = `var(--ara-composer-h, ${height}px)`;
    return (
        <div
            aria-hidden
            style={{
                height: aboveTabBar ? `calc(${base} + 50px)` : base,
            }}
        />
    );
}
