'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { BottomTabBar, isTabRoot } from './BottomTabBar';
import { getBridge, useBridgeEvent } from '../_bridge';
import { getSharedKeyboardTracker } from '@sparcs-kaist/keyboard-inset';
import { useKeyboardCssVars } from '@sparcs-kaist/keyboard-inset/react';
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
        };
    }, []);

    // The shipped shell only forwards hardware back as `back:pressed` and
    // never pops natively; newer shells decide natively and never emit this.
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

    // Publish --kb-inset / --kb-visible / --kb-visual-height on <html>
    // (host-agnostic keyboard geometry, see @sparcs-kaist/keyboard-inset).
    useKeyboardCssVars();
    // The shell doesn't emit keyboard:changed today; if it ever does, the
    // tracker normalizes the raw height so a resize-mode host can't double-lift.
    useBridgeEvent('keyboard:changed', (p) => {
        getSharedKeyboardTracker().setOverride(p.visible ? p.height : null);
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
