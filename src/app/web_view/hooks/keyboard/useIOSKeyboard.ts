import { useState, useEffect } from 'react';

export function useIOSKeyboard() {
    const [keyboardHeight, setKeyboardHeight] = useState(0);
    const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

    useEffect(() => {
        const viewport = window.visualViewport;
        if (!viewport) return;

        const handler = () => {
            // visualViewport.height는 키보드 제외 높이
            // window.innerHeight에는 Safe Area가 포함되어 있을 수 있음

            const layoutViewportHeight = window.innerHeight;
            const visualViewportHeight = viewport.height;

            const diff = layoutViewportHeight - visualViewportHeight;

            const isKeyboardOpen = diff > 10; // tolerance of 10px : prevent scroll jump issue in IOS

            setKeyboardHeight(isKeyboardOpen ? diff : 0);
            setIsKeyboardOpen(isKeyboardOpen);
        };

        viewport.addEventListener("resize", handler);
        viewport.addEventListener("scroll", handler); // iOS scroll -> viewpoint varies

        return () => {
            viewport.removeEventListener("resize", handler);
            viewport.removeEventListener("scroll", handler);
        };
    }, []);

    return { keyboardHeight, isKeyboardOpen };
}