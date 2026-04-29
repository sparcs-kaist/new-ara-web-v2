'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { isTabRoot } from './BottomTabBar';

interface PageTransitionProps {
    pathname: string;
    children: ReactNode;
}

type Direction = 'forward' | 'back';

/**
 * Wraps the current `/web_view/*` page in the iOS-style slide animation —
 * matching Flutter's `CupertinoPageRoute` (`utils/slide_routing.dart`).
 *
 * Direction detection: a `popstate` event fires synchronously *before*
 * Next.js renders the new page when the user goes back/forward via the
 * hardware button, an iOS edge-swipe, or `router.back()`. We capture
 * that on a ref and read it at the moment the pathname changes — that
 * way the very first render with the new pathname already has the
 * correct animation class (no forward-then-back flash).
 *
 * Tab roots (Main / Board / Notifications / MyInfo) render without an
 * animation — Flutter's bottom-nav swap is also a direct cut.
 */
export function PageTransition({ pathname, children }: PageTransitionProps) {
    const popRef = useRef(false);
    const lastPathRef = useRef(pathname);

    useEffect(() => {
        const onPop = () => {
            popRef.current = true;
        };
        window.addEventListener('popstate', onPop);
        return () => window.removeEventListener('popstate', onPop);
    }, []);

    // Resolve direction *during* render so the first paint of the new
    // pathname gets the right class. Mutating refs in render is safe here
    // — they're read once per pathname change and never feed back into
    // hooks. The alternative (useState + useEffect) would race the CSS.
    let direction: Direction = 'forward';
    if (lastPathRef.current !== pathname) {
        direction = popRef.current ? 'back' : 'forward';
        popRef.current = false;
        lastPathRef.current = pathname;
    }

    if (isTabRoot(pathname)) {
        return <>{children}</>;
    }

    const cls = direction === 'back' ? 'ara-page-slide-back-in' : 'ara-page-slide-in';
    return (
        <div key={pathname} className={cls}>
            {children}
        </div>
    );
}
