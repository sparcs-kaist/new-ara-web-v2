'use client';

import type { ReactNode } from 'react';

interface StickyComposerProps {
    children: ReactNode;
    /** Reserve space for the bottom tab bar in addition to safe area / keyboard. */
    aboveTabBar?: boolean;
    className?: string;
}

/**
 * Bottom-anchored bar that auto-lifts above the software keyboard.
 *
 * The lift comes from the `--ara-keyboard-height` CSS variable, which is set
 * in `web_view/layout.tsx` from `useKeyboard()` (visualViewport) and from
 * the native `keyboard:changed` bridge event.
 */
export function StickyComposer({ children, aboveTabBar = false, className }: StickyComposerProps) {
    return (
        <div
            className={[
                'fixed inset-x-0 z-[45] bg-white border-t border-[#F0F0F0] transition-[bottom] duration-150',
                className ?? '',
            ]
                .filter(Boolean)
                .join(' ')}
            style={{
                bottom: aboveTabBar
                    ? 'calc(var(--ara-keyboard-height, 0px) + 50px + var(--ara-safe-bottom))'
                    : 'calc(var(--ara-keyboard-height, 0px) + var(--ara-safe-bottom))',
                paddingLeft: 'var(--ara-safe-left)',
                paddingRight: 'var(--ara-safe-right)',
            }}
        >
            {children}
        </div>
    );
}

/** Spacer that prevents the last list item from sitting under the composer. */
export function ComposerSpacer({ height = 64, aboveTabBar = false }: { height?: number; aboveTabBar?: boolean }) {
    return (
        <div
            aria-hidden
            style={{
                height: aboveTabBar
                    ? `calc(${height}px + 50px + var(--ara-safe-bottom))`
                    : `calc(${height}px + var(--ara-safe-bottom))`,
            }}
        />
    );
}
