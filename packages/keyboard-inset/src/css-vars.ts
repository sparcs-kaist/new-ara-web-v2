import type { KeyboardState, KeyboardTracker } from './tracker';

export interface PublishCssVarsOptions {
    /** Element receiving the custom properties. Default: `<html>`. */
    target?: HTMLElement;
    /** Property name prefix. Default `'--kb'`. */
    prefix?: string;
}

/**
 * Mirror tracker state into CSS custom properties so layout can be pure CSS:
 *
 *   `${prefix}-inset`          px the keyboard occludes (lift fixed-bottom bars by this)
 *   `${prefix}-visible`        unitless 0 | 1 — multiply lengths by `(1 - var(--kb-visible))`
 *                              to zero them out while the keyboard is up
 *   `${prefix}-visual-height`  px height of the visual viewport (size chat shells with it)
 *
 * Publishes synchronously once on attach; the returned unsubscribe removes
 * all three properties so no stale inset survives leaving the screen.
 */
export function publishKeyboardCssVars(
    tracker: KeyboardTracker,
    opts: PublishCssVarsOptions = {},
): () => void {
    if (typeof window === 'undefined') return () => {};
    const target = opts.target ?? document.documentElement;
    const prefix = opts.prefix ?? '--kb';

    const apply = (s: KeyboardState) => {
        target.style.setProperty(`${prefix}-inset`, `${s.insetPx}px`);
        target.style.setProperty(`${prefix}-visible`, s.visible ? '1' : '0');
        // Never publish the pre-measurement 0 — an inline 0px would shadow
        // whatever stylesheet fallback (e.g. 100dvh) the consumer relies on
        // until the tracker's first evaluation lands.
        if (s.visualHeight > 0) {
            target.style.setProperty(`${prefix}-visual-height`, `${s.visualHeight}px`);
        }
    };

    const unsubscribe = tracker.subscribe(apply);
    apply(tracker.getState());

    return () => {
        unsubscribe();
        target.style.removeProperty(`${prefix}-inset`);
        target.style.removeProperty(`${prefix}-visible`);
        target.style.removeProperty(`${prefix}-visual-height`);
    };
}
