const DELAY_MS = 100;
const MIN_VISIBLE_MS = 100;
const FADE_MS = 150;
const MOVE_PX = 8;
const SELECTOR = 'button, a[href], [role="button"], [role="tab"], summary, [data-press]';
const SKIP = ':disabled, [aria-disabled="true"], [data-press="none"]';

export function installPressFeedback(): () => void {
    let el: Element | null = null;
    let pointerId: number | null = null;
    let startX = 0;
    let startY = 0;
    let pressedAt = 0;
    let timer: number | undefined;
    let deferTimer: number | undefined;

    const press = () => {
        el?.setAttribute('data-pressed', '');
        pressedAt = performance.now();
    };

    const cancel = () => {
        window.clearTimeout(timer);
        el?.removeAttribute('data-pressed');
        el?.removeAttribute('data-press-release');
        el = null;
        pointerId = null;
    };

    const release = () => {
        const target = el;
        if (!target) return;
        window.clearTimeout(timer);
        pointerId = null;
        if (!target.hasAttribute('data-pressed')) press();
        timer = window.setTimeout(() => {
            target.removeAttribute('data-pressed');
            target.setAttribute('data-press-release', '');
            timer = window.setTimeout(() => {
                target.removeAttribute('data-press-release');
                el = null;
            }, FADE_MS);
        }, Math.max(0, pressedAt + MIN_VISIBLE_MS - performance.now()));
    };

    const onDown = (e: PointerEvent) => {
        const target = (e.target as Element).closest?.(SELECTOR);
        if (!target || e.button !== 0 || target.matches(SKIP)) return;
        cancel();
        el = target;
        pointerId = e.pointerId;
        startX = e.clientX;
        startY = e.clientY;
        timer = window.setTimeout(press, DELAY_MS);
    };

    const onMove = (e: PointerEvent) => {
        if (e.pointerId === pointerId && Math.hypot(e.clientX - startX, e.clientY - startY) > MOVE_PX) cancel();
    };

    const onUp = (e: PointerEvent) => {
        if (e.pointerId !== pointerId) return;
        // The browser cancels the pointer when a pan starts inside the touch slop, before any move exceeds MOVE_PX.
        if (e.type === 'pointercancel') cancel();
        else release();
    };

    // Only a scroll under the finger is a pan; one after release (chat scroll-to-bottom, anchoring) keeps the flash.
    const onScroll = () => {
        if (pointerId !== null) cancel();
    };

    // Native "pressed, then act": a cached route otherwise replaces the element before its overlay ever paints.
    const onClick = (e: MouseEvent) => {
        const target = el;
        const wait = pressedAt + MIN_VISIBLE_MS - performance.now();
        if (!e.isTrusted || wait <= 0 || !target?.hasAttribute('data-pressed')) return;
        if ((e.target as Element).closest?.(SELECTOR) !== target) return;
        e.stopPropagation();
        e.preventDefault();
        const init = { bubbles: true, cancelable: true, composed: true, clientX: e.clientX, clientY: e.clientY, button: 0 };
        deferTimer = window.setTimeout(() => target.dispatchEvent(new MouseEvent('click', init)), wait);
    };

    const onVisibility = () => {
        if (document.visibilityState === 'hidden') cancel();
    };

    const ac = new AbortController();
    const capture = { capture: true, signal: ac.signal };
    const passive = { ...capture, passive: true };
    document.addEventListener('pointerdown', onDown, capture);
    document.addEventListener('pointermove', onMove, passive);
    document.addEventListener('pointerup', onUp, capture);
    document.addEventListener('pointercancel', onUp, capture);
    document.addEventListener('click', onClick, capture);
    // Capture: inner scrollers' scroll events do not bubble.
    document.addEventListener('scroll', onScroll, passive);
    document.addEventListener('visibilitychange', onVisibility, { signal: ac.signal });
    window.addEventListener('blur', cancel, { signal: ac.signal });
    return () => {
        cancel();
        window.clearTimeout(deferTimer);
        ac.abort();
    };
}
