'use client';

import { useCallback, useEffect, useSyncExternalStore, type RefObject } from 'react';
import {
    getSharedKeyboardTracker,
    INITIAL_KEYBOARD_STATE,
    type KeyboardState,
    type KeyboardTracker,
} from './tracker';
import { publishKeyboardCssVars, type PublishCssVarsOptions } from './css-vars';
import { createBottomAnchor, type ScrollPinMode } from './scroll-anchor';
import { getSharedKeyboardMotion, type KeyboardMotionOptions } from './motion';

// useSyncExternalStore requires a referentially stable server snapshot —
// a fresh object per call triggers React's getServerSnapshot hydration loop.
function getServerSnapshot(): KeyboardState {
    return INITIAL_KEYBOARD_STATE;
}

/**
 * Subscribe to soft-keyboard state. Safe under SSR (returns the closed
 * state on the server and for the hydration pass).
 */
export function useKeyboard(tracker?: KeyboardTracker): KeyboardState {
    const t = tracker ?? getSharedKeyboardTracker();
    // Stable per tracker: an inline arrow makes uSES tear down and recreate
    // the DOM listeners every render via the ref-counted subscribe.
    const subscribe = useCallback((onChange: () => void) => t.subscribe(onChange), [t]);
    const getSnapshot = useCallback(() => t.getState(), [t]);
    return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/**
 * Publish `--kb-inset` / `--kb-visible` / `--kb-visual-height` on `<html>`
 * (or `opts.target`) for the lifetime of the calling component. Options are
 * read once on mount. Pass `motion`/`host` to animate the published values
 * on the platform keyboard curve (see `withKeyboardMotion`) — use the same
 * values in every hook of the app so all consumers share one clock.
 */
export function useKeyboardCssVars(opts?: PublishCssVarsOptions & KeyboardMotionOptions): void {
    useEffect(
        () => publishKeyboardCssVars(getSharedKeyboardMotion(opts), opts),
        // Options are mount-time-only: identity changes would tear down and
        // rebuild the publisher, and callers pass object literals.
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [],
    );
}

export interface BottomAnchoredScrollOptions {
    /**
     * `'at-bottom'` (default): re-glue to the bottom edge only when the user
     * was already there. `'always'`: preserve the bottom-edge content
     * wherever the user is — messenger-style folding against the keyboard.
     */
    pin?: ScrollPinMode;
    /**
     * How close (px) to the bottom edge still counts as "at the bottom"
     * (`'at-bottom'` mode). Default 40.
     */
    slack?: number;
    /** Scroll to the bottom when anchoring starts. Default true. */
    startAtBottom?: boolean;
}

/**
 * Keep a scroll container's bottom edge anchored across CONTAINER resizes
 * (e.g. the keyboard shrinking a chat list) — see `pin` for the two UX
 * modes. Content growth is out of scope (it doesn't change the container
 * box): keep scrolling on data changes yourself.
 */
export function useBottomAnchoredScroll<T extends HTMLElement>(
    ref: RefObject<T | null>,
    opts: BottomAnchoredScrollOptions = {},
): void {
    const { pin = 'at-bottom', slack = 40, startAtBottom = true } = opts;
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        return createBottomAnchor(el, { pin, slack, startAtBottom });
    }, [ref, pin, slack, startAtBottom]);
}

export interface WindowBottomAnchoredScrollOptions extends KeyboardMotionOptions {
    /**
     * Default `'always'` — the reason to mount this hook is the
     * messenger-style fold; pass `'at-bottom'` for feed-style surfaces.
     */
    pin?: ScrollPinMode;
    /** See {@link BottomAnchoredScrollOptions.slack}. */
    slack?: number;
}

/**
 * Bottom-anchor the DOCUMENT scroller across keyboard presentations, for
 * pages that scroll the window rather than an inner column (a post with a
 * fixed comment composer). Never moves the page on mount; shrink
 * compensation is keyboard-gated so browser chrome noise can't drift it.
 * `motion`/`host` must match the values given to `useKeyboardCssVars`.
 */
export function useWindowBottomAnchoredScroll(
    opts: WindowBottomAnchoredScrollOptions = {},
): void {
    const { pin = 'always', slack = 40, motion, host, duration, easing } = opts;
    useEffect(
        () => createBottomAnchor(window, {
            pin,
            slack,
            tracker: getSharedKeyboardMotion({ motion, host, duration, easing }),
        }),
        // easing is an array; compare by value like the other options.
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [pin, slack, motion, host, duration, JSON.stringify(easing)],
    );
}

export type { KeyboardState, KeyboardTracker, KeyboardViewportMode, KeyboardTrackerOptions } from './tracker';
export type { ScrollPinMode, BottomAnchorOptions } from './scroll-anchor';
