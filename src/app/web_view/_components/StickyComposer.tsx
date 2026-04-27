'use client';

import type { CSSProperties, ReactNode } from 'react';

interface StickyComposerProps {
    children: ReactNode;
    /** Reserve space for the bottom tab bar in addition to safe area. */
    aboveTabBar?: boolean;
    className?: string;
    style?: CSSProperties;
}

/**
 * A bar that sticks to the bottom of the viewport and lifts itself above the
 * software keyboard. Use it for comment input, message composers, etc.
 *
 * The lift is driven by the `--ara-keyboard-height` CSS variable, which the
 * web_view layout updates from `useKeyboard()` (visualViewport) and from the
 * native `keyboard:changed` bridge event.
 */
export function StickyComposer({ children, aboveTabBar = false, className, style }: StickyComposerProps) {
    return (
        <div
            className={['ara-composer', className ?? ''].filter(Boolean).join(' ')}
            style={{
                position: 'fixed',
                left: 0,
                right: 0,
                bottom: aboveTabBar
                    ? 'calc(var(--ara-keyboard-height, 0px) + var(--ara-tab-height) + var(--ara-safe-bottom))'
                    : 'calc(var(--ara-keyboard-height, 0px) + var(--ara-safe-bottom))',
                background: 'var(--ara-bg)',
                borderTop: '1px solid var(--ara-divider)',
                paddingLeft: 'var(--ara-safe-left)',
                paddingRight: 'var(--ara-safe-right)',
                transition: 'bottom 0.16s ease',
                zIndex: 45,
                ...style,
            }}
        >
            {children}
        </div>
    );
}

/**
 * Spacer to place at the end of a scrollable region so its last item isn't
 * hidden by the StickyComposer.
 */
export function ComposerSpacer({ height = 64, aboveTabBar = false }: { height?: number; aboveTabBar?: boolean }) {
    return (
        <div
            aria-hidden
            style={{
                height: aboveTabBar
                    ? `calc(${height}px + var(--ara-tab-height) + var(--ara-safe-bottom))`
                    : `calc(${height}px + var(--ara-safe-bottom))`,
            }}
        />
    );
}
