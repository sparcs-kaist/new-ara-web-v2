'use client';

import { useEffect, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { BottomTabBar, isTabRoot } from './BottomTabBar';
import { getBridge, useBridgeEvent } from '../_bridge';
import useKeyboard from '../hooks/keyboard/useKeyboard';
import { WebViewQueryProvider } from '../_query';
import { PageTransition } from './PageTransition';

export function WebViewClientLayout({ children }: { children: ReactNode }) {
    const pathname = usePathname();
    const showTabBar = isTabRoot(pathname);

    // Mark <html> with the shell attribute so the scoped tokens apply, and
    // sync the safe-area inset values reported by the native bridge.
    useEffect(() => {
        const root = document.documentElement;
        root.setAttribute('data-ara-shell', '');
        let cancelled = false;
        getBridge()
            .ready()
            .then((cap) => {
                if (cancelled || !cap) return;
                root.style.setProperty('--ara-safe-top', `${cap.safeArea.top}px`);
                root.style.setProperty('--ara-safe-bottom', `${cap.safeArea.bottom}px`);
                root.style.setProperty('--ara-safe-left', `${cap.safeArea.left}px`);
                root.style.setProperty('--ara-safe-right', `${cap.safeArea.right}px`);
                root.setAttribute('data-ara-platform', cap.platform);
            });
        return () => {
            cancelled = true;
            root.removeAttribute('data-ara-shell');
            root.removeAttribute('data-ara-platform');
            root.style.removeProperty('--ara-safe-top');
            root.style.removeProperty('--ara-safe-bottom');
            root.style.removeProperty('--ara-safe-left');
            root.style.removeProperty('--ara-safe-right');
            root.style.removeProperty('--ara-keyboard-height');
        };
    }, []);

    // Hardware back is intercepted in the native shell's MainActivity
    // (Android) and decided there — it's the only place where the
    // OnBackInvokedDispatcher fires authoritatively before the system
    // can finish the activity. We don't listen for `back:pressed` here.

    // Keyboard height — visualViewport on web, optionally overridden by a
    // native event when the host wants to push a sheet over the WebView.
    const { keyboardHeight } = useKeyboard();
    useEffect(() => {
        document.documentElement.style.setProperty('--ara-keyboard-height', `${keyboardHeight}px`);
    }, [keyboardHeight]);
    useBridgeEvent('keyboard:changed', (p) => {
        document.documentElement.style.setProperty('--ara-keyboard-height', `${p.height}px`);
    });

    return (
        <WebViewQueryProvider>
            {/* Fixed white cap over the status-bar / camera-notch zone.
                Without it, scrolling the body lifts the page content into
                the safe-area on Android (the InAppWebView paints behind
                the system bars) and the camera cutout becomes visible on
                top of the content. The bottom tab bar already covers the
                bottom safe-area. */}
            <div
                aria-hidden
                className="fixed inset-x-0 top-0 z-50 bg-white"
                style={{ height: 'var(--ara-safe-top)', pointerEvents: 'none' }}
            />
            <PageTransition pathname={pathname}>{children}</PageTransition>
            {showTabBar && <BottomTabBar />}
        </WebViewQueryProvider>
    );
}
