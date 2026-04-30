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
 * The lift uses `max(--ara-keyboard-height, --ara-safe-bottom)` rather
 * than summing them — when the keyboard is up it sits flush against the
 * device's bottom edge, fully covering the home-indicator safe area, so
 * adding the safe-bottom on top would push the composer above the
 * keyboard. With max() we get:
 *   - keyboard closed → composer sits above the home indicator
 *   - keyboard open   → composer sits exactly above the keyboard.
 *
 * The keyboard height itself is published in `--ara-keyboard-height` by
 * `web_view/layout.tsx` (visualViewport on iOS; bridge `keyboard:changed`
 * on demand). On Android the WebView already shrinks via `adjustResize`,
 * so `useAndroidKeyboard` reports `keyboardHeight: 0` and the layout
 * shrink alone positions us correctly.
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
                    ? 'calc(max(var(--ara-keyboard-height, 0px), var(--ara-safe-bottom)) + 50px)'
                    : 'max(var(--ara-keyboard-height, 0px), var(--ara-safe-bottom))',
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
