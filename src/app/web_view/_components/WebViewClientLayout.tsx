'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { BottomTabBar, isTabRoot } from './BottomTabBar';
import { getBridge, useBridgeEvent } from '../_bridge';
import { getSharedKeyboardGlide, getSharedKeyboardTracker, isEditableElement } from '@sparcs-kaist/keyboard-inset';
import { useKeyboardCssVars } from '@sparcs-kaist/keyboard-inset/react';
import { KEYBOARD_GLIDE } from './keyboardMotion';
import { createKeyboardPredictor } from './keyboardPredict';
import { createKeyboardReplay, type KeyboardReplay } from './keyboardReplay';
import { WebViewQueryProvider } from '../_query';
import { PageTransition } from './PageTransition';
import { PushTokenRegistrar } from './PushTokenRegistrar';
import { UpdatePrompt } from './UpdatePrompt';
import { installPressFeedback } from './pressFeedback';

const MAIN_PATH = /^\/web_view\/Main\/?$/;
const EXIT_TOAST_MS = 2000;

// Backend push data convention: { type: 'chat' | 'comment' | 'article', target_id, article_id? }.
function pushRoute(data?: Record<string, unknown>): string | undefined {
    if (!data) return undefined;
    if (data.type === 'chat' && data.target_id != null) return `/web_view/Chat/${data.target_id}`;
    const articleId = data.article_id ?? data.target_id;
    if ((data.type === 'comment' || data.type === 'article') && articleId != null) return `/web_view/Post/${articleId}`;
    return undefined;
}

export function WebViewClientLayout({ children }: { children: ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const showTabBar = isTabRoot(pathname);
    const [exitToastAt, setExitToastAt] = useState<number | null>(null);
    const lastBackAtRef = useRef<number | null>(null);
    const replayRef = useRef<KeyboardReplay | null>(null);

    // Mark <html> with the shell attribute so the scoped tokens apply, and
    // sync the safe-area inset values reported by the native bridge.
    useEffect(() => {
        const root = document.documentElement;
        root.setAttribute('data-ara-shell', '');
        const uninstallPress = installPressFeedback();
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
            uninstallPress();
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
        // An open panel/sheet/prompt closes first, like a native screen; they all listen for Escape.
        if (document.querySelector('[role="dialog"]')) {
            document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
            return;
        }
        // Main and Login are the only pages a back press may leave the app from.
        const onRoot = MAIN_PATH.test(pathname ?? '') || pathname === '/web_view/Login';
        if (!onRoot) {
            // A sub-page never exits: with no history to pop, go home instead.
            if (window.history.length > 1) router.back();
            else router.replace('/web_view/Main');
            return;
        }
        // At Main: first press shows the toast; a second within 2s actually exits.
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

    // A press before backgrounding must not count as the first half of a double press after resume.
    useEffect(() => {
        const reset = () => {
            lastBackAtRef.current = null;
            setExitToastAt(null);
        };
        document.addEventListener('visibilitychange', reset);
        return () => document.removeEventListener('visibilitychange', reset);
    }, []);

    // Publish --ara-kb-shrink / --ara-kb-column from the GLIDED layout height.
    // The shell resizes the layout viewport late and in coarse steps, so the
    // raw innerHeight staircase is not something to follow: --ara-kb-column is
    // the eased height the chat column and the fixed composer ride (it can
    // exceed the raw innerHeight mid-glide, on purpose), and --ara-kb-shrink
    // is its distance below the ratcheted unshrunk height. Only keyboard-
    // plausible resizes ratchet; width changes re-baseline. data-ara-kb marks
    // the episode — tokens.css keys the scroll-anchoring opt-out on it. The
    // predictor owns both vars from focusin until the staircase settles.
    // A shell keyboard:changed event drives the inset replay instead of the predictor.
    useEffect(() => {
        const root = document.documentElement;
        const tracker = getSharedKeyboardGlide(KEYBOARD_GLIDE);
        let baseWidth = window.innerWidth;
        let maxHeight = window.innerHeight;
        // Latched through blur so the close animation stays continuous:
        // the last resize frames arrive after focus is gone.
        let engaged = false;
        let settleTimer: number | undefined;
        let learnTimer: number | undefined;
        const replay = createKeyboardReplay({ tracker: getSharedKeyboardTracker() });
        replayRef.current = replay;
        const predictor = createKeyboardPredictor({
            tracker: getSharedKeyboardTracker(),
            publish: (column, shrink) => {
                root.style.setProperty('--ara-kb-shrink', `${Math.max(0, shrink)}px`);
                if (column === null) root.style.removeProperty('--ara-kb-column');
                else root.style.setProperty('--ara-kb-column', `${column}px`);
            },
            getMaxHeight: () => maxHeight,
            isEditable: isEditableElement,
            enabled: () => !replay.received,
        });
        const apply = (height = tracker.getState().layoutHeight || window.innerHeight) => {
            const state = tracker.getState();
            if (!predictor.active) {
                root.style.setProperty('--ara-kb-shrink', `${Math.max(0, maxHeight - height)}px`);
                if (replay.holding) {
                    // Whichever leads: the replayed curve, or the eased layout when a resize step outruns it.
                    root.style.setProperty(
                        '--ara-kb-column',
                        `min(${height}px, calc(${maxHeight}px - var(--ara-kb-replay, 0px)))`,
                    );
                } else if (engaged || height !== window.innerHeight) {
                    root.style.setProperty('--ara-kb-column', `${height}px`);
                } else {
                    root.style.removeProperty('--ara-kb-column');
                }
            }
            if (maxHeight > height || state.visible || predictor.active) {
                root.setAttribute('data-ara-kb', '');
            } else {
                root.removeAttribute('data-ara-kb');
            }
        };
        // Keyboard gone but geometry never returned to the ratcheted max
        // (browser-chrome shrink latched as a close animation): drop the
        // phantom instead of pinning the composer low until a rotation.
        // A real shell close reaches shrink 0 well inside the grace window,
        // making this a no-op there.
        const releaseIfStuck = () => {
            settleTimer = undefined;
            if (window.innerHeight >= maxHeight) return;
            if (isEditableElement(document.activeElement) || tracker.getState().visible) return;
            maxHeight = window.innerHeight;
            engaged = false;
            apply();
        };
        const onTrackerChange = () => {
            apply();
            if (window.innerHeight < maxHeight && !tracker.getState().visible && settleTimer === undefined) {
                settleTimer = window.setTimeout(releaseIfStuck, 600);
            }
        };
        // The settled shrink of a keyboard episode is what the predictor replays next time.
        const scheduleLearn = () => {
            if (learnTimer !== undefined) window.clearTimeout(learnTimer);
            learnTimer = window.setTimeout(() => {
                learnTimer = undefined;
                if (engaged && window.innerHeight < maxHeight) {
                    predictor.learn(maxHeight - window.innerHeight);
                }
            }, 150);
        };
        const onResize = () => {
            if (window.innerWidth !== baseWidth) {
                baseWidth = window.innerWidth;
                maxHeight = window.innerHeight;
                engaged = false;
                // The eased height is rAF-late; a rotation must not leave it on the column for a frame.
                apply(window.innerHeight);
                return;
            }
            // Only a keyboard-plausible resize counts: browser-chrome
            // (URL bar / toolbar) height moves with no editable focused,
            // and attributing those to the keyboard would collapse the
            // composer clearance while merely reading. Non-keyboard
            // resizes re-baseline instead. Focus is read synchronously —
            // the tracker's own flag is rAF-late by design.
            if (isEditableElement(document.activeElement) || tracker.getState().visible || engaged) {
                maxHeight = Math.max(maxHeight, window.innerHeight);
                engaged = maxHeight > window.innerHeight;
                scheduleLearn();
            } else {
                maxHeight = window.innerHeight;
            }
            apply();
        };
        onResize();
        window.addEventListener('resize', onResize);
        const unsubscribe = tracker.subscribe(onTrackerChange);
        return () => {
            unsubscribe();
            window.removeEventListener('resize', onResize);
            predictor.destroy();
            replay.destroy();
            replayRef.current = null;
            if (settleTimer !== undefined) window.clearTimeout(settleTimer);
            if (learnTimer !== undefined) window.clearTimeout(learnTimer);
            root.style.removeProperty('--ara-kb-shrink');
            root.style.removeProperty('--ara-kb-column');
            root.removeAttribute('data-ara-kb');
        };
    }, []);

    // Publish --kb-inset / --kb-visible / --kb-visual-height on <html>
    // (host-agnostic keyboard geometry, see @sparcs-kaist/keyboard-inset).
    useKeyboardCssVars(KEYBOARD_GLIDE);
    // Sent once at IME animation start; the replay normalizes so a resize-mode host can't double-lift.
    useBridgeEvent('keyboard:changed', (p) => {
        replayRef.current?.play(p);
    });
    // The shell hands the push data over untouched; anything outside /web_view is ignored.
    useBridgeEvent('push:opened', (p) => {
        const to = typeof p.data?.route === 'string' ? p.data.route : (pushRoute(p.data) ?? p.deepLink);
        if (to && to.startsWith('/web_view/')) router.push(to);
    });

    return (
        <WebViewQueryProvider>
            <PushTokenRegistrar />
            <UpdatePrompt />
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
