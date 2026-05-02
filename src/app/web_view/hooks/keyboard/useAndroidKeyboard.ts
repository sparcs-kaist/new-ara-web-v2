import { useState, useEffect } from 'react';

/**
 * The Flutter shell's Android activity uses `windowSoftInputMode="adjustResize"`
 * (see `android/app/src/main/AndroidManifest.xml`), so the WebView itself
 * shrinks when the keyboard opens — `position: fixed; bottom: 0` already
 * lands above the keyboard. Reporting a non-zero `keyboardHeight` here
 * would cause the StickyComposer to lift *again* on top of that, which is
 * what produced the "comment box ascends to heaven" bug.
 *
 * We keep `isKeyboardOpen` for callers that need to know whether the
 * keyboard is up, but `keyboardHeight` stays 0 — the layout shrink plus
 * the safe-area-bottom are enough to position the composer correctly.
 */
export function useAndroidKeyboard() {
    const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

    useEffect(() => {
        const baseHeight = window.innerHeight;
        const handleResize = () => {
            setIsKeyboardOpen(baseHeight - window.innerHeight > 80);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return { keyboardHeight: 0, isKeyboardOpen };
}
