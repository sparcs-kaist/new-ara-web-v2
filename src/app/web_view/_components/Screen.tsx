'use client';

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { isTabRoot } from './BottomTabBar';

interface ScreenProps {
    children: ReactNode;
    /**
     * Reserve space for the bottom tab bar.
     * - `'auto'` (default): reserve when the route is one of the tab roots.
     * - `true` / `false`: force on/off.
     */
    withTabBar?: boolean | 'auto';
    className?: string;
}

/**
 * Root wrapper for any web_view page. Applies safe-area padding (top/sides
 * always; bottom only when no tab bar is visible) and reserves space for
 * the bottom tab bar so content isn't hidden underneath it.
 *
 * The visual chrome (header, lists, etc.) is provided by each page — Screen
 * intentionally adds no border, shadow or background of its own so the
 * native UI stays exactly the way Flutter rendered it.
 */
export function Screen({ children, withTabBar = 'auto', className }: ScreenProps) {
    const pathname = usePathname();
    const showTabBar = withTabBar === 'auto' ? isTabRoot(pathname) : withTabBar;

    return (
        <main
            className={['flex min-h-[100dvh] flex-col bg-white', className ?? '']
                .filter(Boolean)
                .join(' ')}
            style={{
                paddingTop: 'var(--ara-safe-top)',
                paddingLeft: 'var(--ara-safe-left)',
                paddingRight: 'var(--ara-safe-right)',
                paddingBottom: showTabBar
                    ? 'calc(56px + var(--ara-safe-bottom))'
                    : 'var(--ara-safe-bottom)',
            }}
        >
            {children}
        </main>
    );
}
