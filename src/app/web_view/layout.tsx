'use client';

import { useEffect, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import './_styles/tokens.css';
import './_styles/transitions.css';
import { BottomTabBar, isTabRoot } from './_components/BottomTabBar';
import { getBridge, useBridgeEvent } from './_bridge';
import useKeyboard from './hooks/keyboard/useKeyboard';
import { WebViewQueryProvider } from './_query';
import { PageTransition } from './_components/PageTransition';

export default function WebViewLayout({ children }: { children: ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
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

    // Replace Next.js's default `width=device-width, initial-scale=1`
    // viewport with the native-app strict variant for the duration of
    // /web_view/*. The default viewport allows pinch-zoom AND lets
    // Android Chromium keep layout viewport ≠ visual viewport, which
    // is the root cause of:
    //   - users zooming the entire shell with two fingers
    //   - sticky headers pinning at a coordinate the user can't see
    //   - body-level overflow that should never exist
    //   - keyboard reflow visually "sliding" the page in from the side
    // Restored on unmount so the desktop routes (/login, /, …) keep
    // their normal zoomable viewport.
    useEffect(() => {
        const desired =
            'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover';
        let meta = document.querySelector(
            'meta[name="viewport"]',
        ) as HTMLMetaElement | null;
        const previous = meta?.content;
        let injected = false;
        if (meta) {
            meta.content = desired;
        } else {
            meta = document.createElement('meta');
            meta.name = 'viewport';
            meta.content = desired;
            document.head.appendChild(meta);
            injected = true;
        }
        return () => {
            if (!meta) return;
            if (injected) meta.remove();
            else if (previous != null) meta.content = previous;
        };
    }, []);

    // Hardware back button on Android: navigate within the SPA history.
    useBridgeEvent('back:pressed', () => {
        if (typeof window === 'undefined') return;
        if (window.history.length > 1) router.back();
    });

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
