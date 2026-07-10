'use client';

import { useEffect, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { BottomTabBar, isTabRoot } from './BottomTabBar';
import { getBridge, useBridgeEvent } from '../_bridge';
import { getSharedKeyboardTracker, isEditableElement } from '@sparcs-kaist/keyboard-inset';
import { useKeyboardCssVars } from '@sparcs-kaist/keyboard-inset/react';
import { WebViewQueryProvider } from '../_query';
import { PageTransition } from './PageTransition';
import { KEYBOARD_MOTION } from './keyboardMotion';

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
        };
    }, []);

    // Hardware back is intercepted and decided in the native shell's
    // MainActivity (Android); we don't listen for `back:pressed` here.

    // Publish --ara-kb-shrink (synchronous layout-viewport shrink px) so fixed
    // bars track the keyboard mid-flight, and stamp data-ara-kb while it's up.
    useEffect(() => {
        const root = document.documentElement;
        const tracker = getSharedKeyboardTracker();
        let baseWidth = window.innerWidth;
        let maxHeight = window.innerHeight;
        let shrink = 0;
        // Latched through blur so the close animation stays continuous:
        // the last resize frames arrive after focus is gone.
        let engaged = false;
        let settleTimer: number | undefined;
        const apply = () => {
            root.style.setProperty('--ara-kb-shrink', `${shrink}px`);
            if (shrink > 0 || tracker.getState().visible) {
                root.setAttribute('data-ara-kb', '');
            } else {
                root.removeAttribute('data-ara-kb');
            }
        };
        // Keyboard gone but geometry never returned to the ratcheted max
        // (chrome shrink latched as a close): drop the phantom composer offset.
        const releaseIfStuck = () => {
            settleTimer = undefined;
            if (shrink === 0) return;
            if (isEditableElement(document.activeElement) || tracker.getState().visible) return;
            maxHeight = window.innerHeight;
            shrink = 0;
            engaged = false;
            apply();
        };
        const onTrackerChange = () => {
            apply();
            if (shrink > 0 && !tracker.getState().visible && settleTimer === undefined) {
                settleTimer = window.setTimeout(releaseIfStuck, 600);
            }
        };
        const onResize = () => {
            if (window.innerWidth !== baseWidth) {
                baseWidth = window.innerWidth;
                maxHeight = window.innerHeight;
                engaged = false;
            }
            // Only a keyboard-plausible resize counts (editable focus /
            // tracker-visible / engaged) — others re-baseline. Focus read sync.
            if (isEditableElement(document.activeElement) || tracker.getState().visible || engaged) {
                maxHeight = Math.max(maxHeight, window.innerHeight);
                shrink = Math.max(0, maxHeight - window.innerHeight);
                engaged = shrink > 0;
            } else {
                maxHeight = window.innerHeight;
                shrink = 0;
            }
            apply();
        };
        onResize();
        window.addEventListener('resize', onResize);
        const unsubscribe = tracker.subscribe(onTrackerChange);
        return () => {
            unsubscribe();
            window.removeEventListener('resize', onResize);
            if (settleTimer !== undefined) window.clearTimeout(settleTimer);
            root.style.removeProperty('--ara-kb-shrink');
            root.removeAttribute('data-ara-kb');
        };
    }, []);

    // Publish --kb-inset / --kb-visible / --kb-visual-height on <html>
    // (host-agnostic keyboard geometry, see @sparcs-kaist/keyboard-inset),
    // animated on the platform keyboard curve.
    useKeyboardCssVars(KEYBOARD_MOTION);
    // The Android overlay-mode shell emits keyboard:changed per animation
    // frame (the WebView surface stays full-height under the IME). The
    // tracker normalizes the raw height against any layout shrink, so a
    // host that still resizes can't double-lift.
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
        </WebViewQueryProvider>
    );
}
