import { useState, useEffect } from 'react';

export function useAndroidKeyboard() {
    const [keyboardHeight, setKeyboardHeight] = useState(0);
    const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

    useEffect(() => {
        const baseHeight = window.innerHeight;

        const handleResize = () => {
            const diff = baseHeight - window.innerHeight;
            setKeyboardHeight(diff);
            setIsKeyboardOpen(diff > 0);

        };
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    return { keyboardHeight, isKeyboardOpen };

}