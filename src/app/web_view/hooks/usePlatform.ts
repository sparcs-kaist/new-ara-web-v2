//User's Platform Detection Hook

export function usePlatform() {
    const user_agent = navigator.userAgent || navigator.vendor;

    const isIOS = /iPhone|iPad|iPod/i.test(user_agent);
    const isAndroid = /Android/i.test(user_agent);

    return {
        isIOS,
        isAndroid,
        isMobile: isIOS || isAndroid,
    }
}