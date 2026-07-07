'use client';

import { useCallback, useEffect, useSyncExternalStore, type RefObject } from 'react';
import {
    getSharedKeyboardTracker,
    INITIAL_KEYBOARD_STATE,
    type KeyboardState,
    type KeyboardTracker,
} from './tracker';
import { publishKeyboardCssVars, type PublishCssVarsOptions } from './css-vars';

// useSyncExternalStore requires a REFERENTIALLY STABLE server snapshot —
// returning a fresh object per call triggers React's "getServerSnapshot
// should be cached" hydration loop.
function getServerSnapshot(): KeyboardState {
    return INITIAL_KEYBOARD_STATE;
}

/**
 * Subscribe to soft-keyboard state. Safe under SSR (returns the closed
 * state on the server and for the hydration pass).
 */
export function useKeyboard(tracker?: KeyboardTracker): KeyboardState {
    const t = tracker ?? getSharedKeyboardTracker();
    // Stable per tracker — an inline arrow would make uSES tear down and
    // re-create the DOM listeners on every render via the ref-counted
    // subscribe.
    const subscribe = useCallback((onChange: () => void) => t.subscribe(onChange), [t]);
    const getSnapshot = useCallback(() => t.getState(), [t]);
    return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/**
 * Publish `--kb-inset` / `--kb-visible` / `--kb-visual-height` on `<html>`
 * (or `opts.target`) for the lifetime of the calling component. Options are
 * read once on mount.
 */
export function useKeyboardCssVars(opts?: PublishCssVarsOptions): void {
    useEffect(
        () => publishKeyboardCssVars(getSharedKeyboardTracker(), opts),
        // Options are intentionally mount-time-only: the publisher tears
        // down/rebuilds on identity change otherwise, and callers pass
        // object literals.
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [],
    );
}

export interface BottomAnchoredScrollOptions {
    /**
     * How close (px) to the bottom edge still counts as "at the bottom".
     * Default 40.
     */
    slack?: number;
}

/**
 * Keep a scroll container glued to its bottom edge across CONTAINER
 * resizes (e.g. the keyboard shrinking a chat list); a user who scrolled
 * up keeps their reading position. The at-bottom flag comes from the
 * container's own scroll events — post-resize geometry can't tell where
 * the user was. Content growth is out of scope (it doesn't change the
 * container box): keep scrolling on data changes yourself.
 */
export function useBottomAnchoredScroll<T extends HTMLElement>(
    ref: RefObject<T | null>,
    opts: BottomAnchoredScrollOptions = {},
): void {
    const slack = opts.slack ?? 40;
    useEffect(() => {
        const el = ref.current;
        if (!el || typeof ResizeObserver === 'undefined') return;

        // Starts true: the initial observe-fire doubles as the initial
        // scroll-to-bottom, which is what a chat screen wants on mount.
        let atBottom = true;

        const onScroll = () => {
            atBottom = el.scrollHeight - el.clientHeight - el.scrollTop <= slack;
        };
        el.addEventListener('scroll', onScroll, { passive: true });

        const ro = new ResizeObserver(() => {
            if (!atBottom) return;
            el.scrollTop = el.scrollHeight - el.clientHeight;
            atBottom = true; // the write above re-fires onScroll, but be explicit
        });
        ro.observe(el);

        return () => {
            ro.disconnect();
            el.removeEventListener('scroll', onScroll);
        };
    }, [ref, slack]);
}

export type { KeyboardState, KeyboardTracker, KeyboardViewportMode, KeyboardTrackerOptions } from './tracker';
