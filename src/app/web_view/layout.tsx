'use client';

import { useEffect, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import './_styles/tokens.css';
import { BottomTabBar, isTabRoot } from './_components/BottomTabBar';
import { getBridge, useBridgeEvent } from './_bridge';
import useKeyboard from './hooks/keyboard/useKeyboard';

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
        <>
            {children}
            {showTabBar && <BottomTabBar />}
        </>
    );
}
