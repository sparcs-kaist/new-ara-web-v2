import type { Viewport } from 'next';
import type { ReactNode } from 'react';
import './_styles/tokens.css';
import './_styles/transitions.css';
import { WebViewClientLayout } from './_components/WebViewClientLayout';

// Strict viewport for the native-app shell. Has to be exported from a
// SERVER component — Android Chromium evaluates the viewport meta once
// at initial layout and ignores any later mutation, so the original
// "set it from useEffect" approach was a no-op on real devices. With
// `width=device-width, initial-scale=1` (Next.js's default) the WebView
// kept layout viewport ≠ visual viewport, which surfaced as: pinch-zoom
// works, sticky headers pin at off-screen coordinates, body has phantom
// overflow, keyboard reflow makes the page slide back in from the side.
export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: 'cover',
};

export default function WebViewLayout({ children }: { children: ReactNode }) {
    return <WebViewClientLayout>{children}</WebViewClientLayout>;
}
