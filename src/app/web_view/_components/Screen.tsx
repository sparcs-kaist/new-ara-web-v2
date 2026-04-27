'use client';

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { isTabRoot } from './BottomTabBar';

interface ScreenProps {
    children: ReactNode;
    /** When true, leave space for the bottom tab bar. Defaults to "auto":
     *  on a tab root path we reserve space; on detail pages we don't. */
    withTabBar?: boolean | 'auto';
    className?: string;
}

/**
 * Standard mobile screen wrapper. Applies safe-area padding and reserves
 * space for the bottom tab bar when appropriate. Use this as the root of
 * any `web_view/<route>/page.tsx`.
 */
export function Screen({ children, withTabBar = 'auto', className }: ScreenProps) {
    const pathname = usePathname();
    const showTabBar = withTabBar === 'auto' ? isTabRoot(pathname) : withTabBar;

    return (
        <main
            className={[
                'ara-screen',
                showTabBar ? 'ara-screen--with-tabbar' : 'ara-screen--no-tabbar',
                className ?? '',
            ]
                .filter(Boolean)
                .join(' ')}
        >
            {children}
        </main>
    );
}
