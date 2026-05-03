'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { BottomTabBar, isTabRoot } from './BottomTabBar';
import { getBridge, useBridgeEvent } from '../_bridge';
import useKeyboard from '../hooks/keyboard/useKeyboard';
import { WebViewQueryProvider } from '../_query';
import { PageTransition } from './PageTransition';

const MAIN_PATH = /^\/web_view\/Main\/?$/;
const EXIT_TOAST_MS = 2000;

export function WebViewClientLayout({ children }: { children: ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const showTabBar = isTabRoot(pathname);
    const [exitToastAt, setExitToastAt] = useState<number | null>(null);
    const lastBackAtRef = useRef<number | null>(null);

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

    // Hardware back is fully owned by the web. The native shell only
    // forwards the press; we decide whether to pop SPA history, show the
    // double-press exit toast, or call the `exit` bridge command.
    //
    // Why on the web: `window.history` always reflects what the user
    // *actually* sees in Next.js — pushState/replaceState are first-class
    // and KakaoTalk-style "are we on Main?" reduces to a pathname check.
    // The native shell's WebView back/forward list races
    // OnBackInvokedCallback on cold-start cookie re-launch and contains
    // the full SSO redirect chain on fresh login, so reasoning over it
    // produced the alternating fresh-vs-cached-login regressions.
    useBridgeEvent('back:pressed', () => {
        if (typeof window === 'undefined') return;
        const onMain = MAIN_PATH.test(pathname ?? '');
        if (!onMain && window.history.length > 1) {
            router.back();
            return;
        }
        // We're at Main (or an unexpected dead-end with no history).
        // First press shows the toast; a second within 2s actually exits.
        const now = Date.now();
        if (lastBackAtRef.current && now - lastBackAtRef.current < EXIT_TOAST_MS) {
            getBridge().send('exit');
            return;
        }
        lastBackAtRef.current = now;
        setExitToastAt(now);
    });

    useEffect(() => {
        if (exitToastAt == null) return;
        const t = window.setTimeout(() => setExitToastAt(null), EXIT_TOAST_MS);
        return () => window.clearTimeout(t);
    }, [exitToastAt]);

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
            {exitToastAt != null && (
                <div
                    role="status"
                    aria-live="polite"
                    className="pointer-events-none fixed inset-x-0 z-[60] flex justify-center"
                    style={{
                        bottom: showTabBar
                            ? 'calc(var(--ara-safe-bottom) + 70px)'
                            : 'calc(var(--ara-safe-bottom) + 20px)',
                    }}
                >
                    <div className="rounded-md bg-black/80 px-4 py-2 text-[14px] font-medium text-white">
                        한 번 더 누르면 종료됩니다.
                    </div>
                </div>
            )}
        </WebViewQueryProvider>
    );
}
