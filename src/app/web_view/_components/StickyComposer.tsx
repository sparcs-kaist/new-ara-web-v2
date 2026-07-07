'use client';

import { useEffect, useRef, type ReactNode } from 'react';

interface StickyComposerProps {
    children: ReactNode;
    /** Reserve space for the bottom tab bar in addition to safe area / keyboard. */
    aboveTabBar?: boolean;
    className?: string;
}

// Home-indicator clearance, zeroed while the keyboard is up (it covers that
// zone — the composer should sit flush against the keyboard).
const CLOSED_RESTING_OFFSET =
    'calc(var(--ara-safe-bottom, env(safe-area-inset-bottom, 0px)) * (1 - var(--kb-visible, 0)))';

/**
 * Bottom-anchored bar that auto-lifts above the software keyboard:
 * `bottom = max(--kb-inset, safe-bottom × (1 − --kb-visible))` — resting on
 * the safe area when closed, flush on the keyboard when open (inset is 0 on
 * hosts whose viewport already shrank, the occlusion elsewhere).
 *
 * The formula must stay pure CSS: the --kb-* vars land in one rAF-batched
 * style commit; routing `visible` through React state instead re-introduces
 * a one-frame mismatch on dismissal. No `transition-[bottom]` either — it
 * double-animates against the OS keyboard animation.
 *
 * Publishes its measured height as `--ara-composer-h` for ComposerSpacer.
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
