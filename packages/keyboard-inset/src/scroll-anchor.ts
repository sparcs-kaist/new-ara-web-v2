/**
 * Bottom-anchored scrolling across keyboard-driven height changes.
 *
 *   'at-bottom' — re-glue to the bottom only if the user was already there.
 *   'always'    — preserve the bottom-edge content wherever the user is; the
 *                 viewport folds against the keyboard (messenger style).
 *
 * Compensation is an ABSOLUTE target from a bottom gap, never a relative
 * delta: engines clamp the offset during a grow before any callback runs, so
 * a relative write double-compensates. A shrink is never clamped (baseline
 * read fresh); a grow may be (baseline is the stored gap). The window target
 * compensates synchronously inside `resize` so per-frame IME resizes track
 * live, and its shrink is keyboard-gated so browser chrome can't drift it.
 * Overlay hosts add `debt`/`carry` ledgers (see inline).
 */

import { getSharedKeyboardTracker, isEditableElement, type KeyboardTracker } from './tracker';

export type ScrollPinMode = 'at-bottom' | 'always';

export interface BottomAnchorOptions {
    /** How to anchor. Default `'at-bottom'`. */
    pin?: ScrollPinMode;
    /**
     * `'at-bottom'` only: px from the bottom edge that still counts as
     * "at the bottom". Default 40.
     */
    slack?: number;
    /**
     * Element targets only: scroll to the bottom when anchoring starts
     * (what a chat column wants on mount). Default true. Ignored for the
     * window target, which must never move on attach.
     */
    startAtBottom?: boolean;
    /**
     * Window target only: keyboard tracker consulted for overlay-mode
     * occlusion and visibility. Default: the shared tracker.
     */
    tracker?: KeyboardTracker;
}

/**
 * Keep `target`'s bottom edge anchored across height changes (see module
 * doc for the mode semantics). Returns a detach function.
 */
export function createBottomAnchor(
    target: HTMLElement | Window,
    opts: BottomAnchorOptions = {},
): () => void {
    if (typeof window === 'undefined') return () => {};
    const pin = opts.pin ?? 'at-bottom';
    const slack = opts.slack ?? 40;
    if (target instanceof HTMLElement) {
        return anchorElement(target, pin, slack, opts.startAtBottom ?? true);
    }
    return anchorWindow(pin, slack, opts.tracker ?? getSharedKeyboardTracker());
}

function anchorElement(
    el: HTMLElement,
    pin: ScrollPinMode,
    slack: number,
    startAtBottom: boolean,
): () => void {
    if (typeof ResizeObserver === 'undefined') return () => {};

    const readGap = () => el.scrollHeight - el.clientHeight - el.scrollTop;
    const writeGap = (gap: number) => {
        el.scrollTop = el.scrollHeight - el.clientHeight - gap;
    };

    // Seeded from geometry, not assumed: a consumer mounting at the top
    // with startAtBottom:false must not count as "at the bottom".
    let gap = readGap();
    let first = true;
    let lastHeight = 0;
    let lastWidth = 0;

    const onScroll = () => {
        // Scroll runs before ResizeObserver delivery: a scroll landing exactly
        // at the new bottom mid-grow is the engine's clamp, not the user.
        if (el.clientHeight > lastHeight && readGap() < 1) return;
        gap = readGap();
    };
    el.addEventListener('scroll', onScroll, { passive: true });

    const ro = new ResizeObserver(() => {
        const height = el.clientHeight;
        const width = el.clientWidth;
        const heightChanged = height !== lastHeight;
        const widthChanged = !first && width !== lastWidth;
        const shrunk = heightChanged && !first && height < lastHeight;
        // Shrink: fresh against the pre-event height (see module doc).
        // Grow: the stored gap is the only uncorrupted pre-event truth.
        const baseline = shrunk
            ? el.scrollHeight - lastHeight - el.scrollTop
            : gap;
        const wasFirst = first;
        first = false;
        lastHeight = height;
        lastWidth = width;
        if (wasFirst) {
            if (startAtBottom) writeGap(0);
        } else if (widthChanged) {
            // Reflow: the old gap is not comparable in either mode. Being
            // at the bottom IS reflow-invariant — keep a glued user glued.
            if (baseline <= slack) writeGap(0);
        } else if (heightChanged) {
            if (pin === 'always') {
                writeGap(baseline);
            } else if (baseline <= slack) {
                writeGap(0);
            }
        }
        gap = readGap();
    });
    ro.observe(el);

    return () => {
        ro.disconnect();
        el.removeEventListener('scroll', onScroll);
    };
}

function anchorWindow(
    pin: ScrollPinMode,
    slack: number,
    tracker: KeyboardTracker,
): () => void {
    const doc = document.documentElement;
    // Document viewport above the keyboard: layout height minus overlay
    // occlusion. Resize hosts move the first term, overlay hosts the second.
    const effectiveHeight = () => doc.clientHeight - tracker.getState().insetPx;
    // Content px below the visible bottom edge.
    const readGap = () => doc.scrollHeight - window.scrollY - effectiveHeight();
    const writeGap = (gap: number) => {
        const max = Math.max(0, doc.scrollHeight - doc.clientHeight);
        const y = doc.scrollHeight - effectiveHeight() - gap;
        // Force instant scroll: under `scroll-behavior: smooth` the write
        // animates async and the carry readback measures a phantom shortfall.
        const scroller = (document.scrollingElement ?? doc) as HTMLElement;
        const prev = scroller.style.scrollBehavior;
        scroller.style.scrollBehavior = 'auto';
        window.scrollTo(window.scrollX, Math.min(max, Math.max(0, y)));
        scroller.style.scrollBehavior = prev;
    };

    let lastHeight = effectiveHeight();
    let lastWidth = window.innerWidth;
    let gap = readGap();
    // NOMINAL px of gate-admitted shrink not yet grown back, drained by the
    // grow delta itself (not achieved movement) so it can't strand the gate.
    let debt = 0;
    // Fold px that clamped at the physical document edge; still owed back on
    // fold-out, or the page drifts up by the un-foldable amount.
    let carry = 0;

    const onScroll = () => {
        gap = readGap();
    };

    const evaluate = () => {
        const width = window.innerWidth;
        const height = effectiveHeight();
        const delta = lastHeight - height; // >0 = shrink toward the keyboard
        const prevHeight = lastHeight;
        lastHeight = height;
        if (width !== lastWidth) {
            // Orientation change: geometry incomparable, drop the ledgers.
            lastWidth = width;
            debt = 0;
            carry = 0;
            gap = readGap();
            return;
        }
        if (delta === 0) return;
        if (delta > 0) {
            // Shrink baseline read fresh (never clamped). userGap is what the
            // user perceives: raw gap minus any fold stuck at the doc edge.
            const userGap = doc.scrollHeight - window.scrollY - prevHeight - carry;
            // Only a keyboard-plausible shrink engages: editable focus, a
            // latched tracker, or mid-presentation (focus races last frames).
            const keyboardish = isEditableElement(document.activeElement)
                || tracker.getState().visible
                || debt > 0;
            if (keyboardish && (pin === 'always' || userGap <= slack)) {
                writeGap(userGap);
                debt += delta;
                carry = Math.max(0, readGap() - userGap);
            }
        } else if (debt > 0) {
            const growth = -delta;
            const undo = Math.min(growth, debt);
            debt -= undo;
            if (pin === 'always') {
                // Fresh baseline, unless scrollY is pinned at the doc bottom
                // (the clamp's signature) where only the stored gap is truth.
                const maxScroll = Math.max(0, doc.scrollHeight - doc.clientHeight);
                const clamped = window.scrollY >= maxScroll - 1;
                const baseline = clamped
                    ? gap
                    : doc.scrollHeight - window.scrollY - prevHeight;
                // Fold out to the user's perceived gap; growth beyond the
                // debt leaves the page where it is.
                const userGap = baseline - carry;
                const target = userGap - (growth - undo);
                writeGap(target);
                carry = Math.max(0, readGap() - target);
            }
            if (debt === 0) carry = 0;
        }
        gap = readGap();
    };

    // Synchronous on purpose: resize-mode hosts fire per animation frame,
    // and compensating inside the event keeps the pin paint-atomic.
    window.addEventListener('resize', evaluate);
    window.visualViewport?.addEventListener('resize', evaluate);
    window.addEventListener('scroll', onScroll, { passive: true });
    const unsubscribe = tracker.subscribe(evaluate); // overlay-mode inset changes
    gap = readGap();

    return () => {
        unsubscribe();
        window.removeEventListener('resize', evaluate);
        window.visualViewport?.removeEventListener('resize', evaluate);
        window.removeEventListener('scroll', onScroll);
    };
}
