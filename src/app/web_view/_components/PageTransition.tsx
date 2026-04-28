'use client';

import type { ReactNode } from 'react';
import { isTabRoot } from './BottomTabBar';

interface PageTransitionProps {
    pathname: string;
    children: ReactNode;
}

/**
 * Wraps the current `/web_view/*` page in the iOS-style slide-from-right
 * animation when navigating to a sub-route — matching Flutter's
 * `CupertinoPageRoute` (`utils/slide_routing.dart`).
 *
 * - Tab roots (Main / Board / Notifications / MyInfo) render without an
 *   animation — Flutter's bottom-nav swap is a direct cut as well.
 * - Sub-routes use a `key={pathname}` so React remounts the wrapper
 *   on every navigation, which restarts the CSS animation. There's no
 *   parallax on the leaving page (Next.js has already unmounted it
 *   before our CSS could pick it up); the 320ms slide-in alone is
 *   enough to hide the "we're in a WebView" feel.
 */
export function PageTransition({ pathname, children }: PageTransitionProps) {
    if (isTabRoot(pathname)) {
        return <>{children}</>;
    }
    return (
        <div key={pathname} className="ara-page-slide-in">
            {children}
        </div>
    );
}
