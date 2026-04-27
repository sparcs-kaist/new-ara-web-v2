'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import './_styles/tokens.css';
import { BottomTabBar, isTabRoot } from './_components/BottomTabBar';
import { getBridge, useBridgeEvent } from './_bridge';
import useKeyboard from './hooks/keyboard/useKeyboard';

export default function WebViewLayout({ children }: { children: ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const showTabBar = isTabRoot(pathname);

    // Apply safe-area inset CSS vars from the bridge handshake (more reliable
    // than env(safe-area-inset-*) inside a WebView on some devices).
    useEffect(() => {
        let cancelled = false;
        getBridge()
            .ready()
            .then((cap) => {
                if (cancelled || !cap) return;
                const root = document.documentElement;
                root.style.setProperty('--ara-safe-top', `${cap.safeArea.top}px`);
                root.style.setProperty('--ara-safe-bottom', `${cap.safeArea.bottom}px`);
                root.style.setProperty('--ara-safe-left', `${cap.safeArea.left}px`);
                root.style.setProperty('--ara-safe-right', `${cap.safeArea.right}px`);
                root.setAttribute('data-ara-platform', cap.platform);
            });
        return () => {
            cancelled = true;
        };
    }, []);

    // Hardware back button on Android: navigate within the SPA history;
    // native exits if the WebView reports it can't go back further.
    useBridgeEvent('back:pressed', () => {
        if (typeof window === 'undefined') return;
        if (window.history.length > 1) {
            router.back();
        }
    });

    // Surface keyboard height as a CSS variable so any sticky element can
    // lift above the keyboard via `bottom: var(--ara-keyboard-height)`.
    // We trust the browser's visualViewport (via useKeyboard) on both
    // platforms; the native `keyboard:changed` event is reserved for cases
    // where the host wants to override (e.g. when pushing a native sheet).
    const { keyboardHeight } = useKeyboard();
    useEffect(() => {
        document.documentElement.style.setProperty(
            '--ara-keyboard-height',
            `${keyboardHeight}px`,
        );
    }, [keyboardHeight]);
    useBridgeEvent('keyboard:changed', (p) => {
        document.documentElement.style.setProperty(
            '--ara-keyboard-height',
            `${p.height}px`,
        );
    });

    // Mark the root with the shell attribute so tokens.css applies. We do
    // this in an effect (not as a literal `<html data-ara-shell>`) because
    // the html element is owned by the root layout.
    const [shellApplied, setShellApplied] = useState(false);
    useEffect(() => {
        document.documentElement.setAttribute('data-ara-shell', '');
        setShellApplied(true);
        return () => {
            document.documentElement.removeAttribute('data-ara-shell');
            document.documentElement.style.removeProperty('--ara-safe-top');
            document.documentElement.style.removeProperty('--ara-safe-bottom');
            document.documentElement.style.removeProperty('--ara-safe-left');
            document.documentElement.style.removeProperty('--ara-safe-right');
            document.documentElement.style.removeProperty('--ara-keyboard-height');
            document.documentElement.removeAttribute('data-ara-platform');
        };
    }, []);

    return (
        <>
            <div suppressHydrationWarning>
                {shellApplied ? children : children}
            </div>
            {showTabBar && <BottomTabBar />}
        </>
    );
}
