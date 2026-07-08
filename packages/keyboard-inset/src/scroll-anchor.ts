/**
 * Bottom-anchored scrolling across keyboard-driven height changes.
 *
 * Two pin modes, because the right UX differs per surface:
 *
 *   'at-bottom' — re-glue to the bottom edge only when the user was already
 *                 there; a user who scrolled up keeps their reading position
 *                 (forum / feed style).
 *   'always'    — preserve whatever content sits at the bottom edge, wherever
 *                 the user is: the viewport "folds" against the keyboard the
 *                 way messenger apps do (KakaoTalk, Instagram DM, Slack).
 *
 * All compensation is written as an ABSOLUTE target derived from a bottom
 * gap (content px hidden below the visible bottom edge), never as a relative
 * delta: when a viewport grows back, engines clamp the scroll offset during
 * layout BEFORE any callback runs, and a relative adjustment on top of that
 * clamp double-compensates. Absolute writes are idempotent against the clamp.
 *
 * Where the baseline gap comes from is direction-dependent:
 *   - A SHRINK is never engine-clamped (the scrollable max only grows), so
 *     the baseline is read fresh against the pre-event height. This also
 *     survives content growth that fired no scroll event (a post body
 *     loading after mount) — a stored gap would be stale.
 *   - A GROW may already be engine-clamped by the time we run, so the
 *     baseline is the STORED gap, maintained by scroll events. On elements,
 *     scroll steps run before ResizeObserver delivery within a frame, so a
 *     scroll bearing the clamp's signature — a grow in flight and a landing
 *     exactly at the new bottom — must not overwrite the stored baseline;
 *     every other scroll is the user and re-baselines live. The window
 *     resize event runs before scroll steps, so the window path needs no
 *     such guard.
 *
 * Element targets compensate on ResizeObserver ticks (the container box is
 * the signal — content growth never fires it). The window target compensates
 * on `resize` synchronously, so on hosts that resize the layout viewport
 * per-frame with the IME animation the content tracks the keyboard
 * frame-by-frame instead of being swallowed and jumping at the end. Window
 * shrink compensation is gated on an editable owning focus (or a visible
 * tracker state) and grow compensation is bounded by NOMINAL debt — the
 * shrink px previously admitted through the gate — so URL-bar chrome noise
 * in plain browsers can never drift the scroll position. Overlay hosts add
 * one more ledger: a fold-in clamped at the physical document edge records
 * the shortfall as `carry`, and fold-out subtracts it, so the page returns
 * to the user's true gap instead of drifting up by the un-foldable px.
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
        // Scroll steps run before ResizeObserver delivery: while a GROW is
        // in flight, a scroll landing exactly at the new bottom is the
        // engine's own clamp — it must not overwrite the pre-event baseline
        // the observer tick is about to need. Anything else (any position
        // above the bottom, or any scroll during a shrink) is the user;
        // ignoring those would make grow ticks fight a live drag.
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
    // Height of the document viewport actually above the keyboard: layout
    // height minus overlay occlusion. Resize-mode hosts move the first term,
    // overlay hosts the second — one delta stream covers both.
    const effectiveHeight = () => doc.clientHeight - tracker.getState().insetPx;
    // Content px below the visible bottom edge.
    const readGap = () => doc.scrollHeight - window.scrollY - effectiveHeight();
    const writeGap = (gap: number) => {
        const max = Math.max(0, doc.scrollHeight - doc.clientHeight);
        const y = doc.scrollHeight - effectiveHeight() - gap;
        // Force an instant scroll: under `scroll-behavior: smooth` the
        // write would animate asynchronously and the carry readback right
        // after it would measure a phantom shortfall. (CSS `auto` means
        // instant; the ScrollOptions 'auto' keyword would defer to CSS.)
        const scroller = (document.scrollingElement ?? doc) as HTMLElement;
        const prev = scroller.style.scrollBehavior;
        scroller.style.scrollBehavior = 'auto';
        window.scrollTo(window.scrollX, Math.min(max, Math.max(0, y)));
        scroller.style.scrollBehavior = prev;
    };

    let lastHeight = effectiveHeight();
    let lastWidth = window.innerWidth;
    let gap = readGap();
    // NOMINAL px of gate-admitted shrink not yet grown back. Drained by the
    // grow delta itself, never by achieved scroll movement — a fold-out that
    // clamps at the top must not strand debt that holds the gate open.
    let debt = 0;
    // Fold px that clamped at the physical document edge (overlay hosts
    // cannot scroll past the end). Still owed back on fold-out, or the page
    // ends up drifted upward by the un-foldable amount.
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
            // Shrink baseline read fresh (never engine-clamped; survives
            // content growth that fired no scroll event). userGap is what
            // the user perceives: the raw gap minus any fold already stuck
            // at the document edge.
            const userGap = doc.scrollHeight - window.scrollY - prevHeight - carry;
            // Only a keyboard-plausible shrink engages: an editable owns
            // focus, the tracker latched a keyboard, or we're inside a
            // compensated presentation (focus can race the last frames).
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
                // Prefer a fresh baseline here too (the stored gap goes
                // stale when the document grows silently under an open
                // keyboard — a post body resolving, a composer growing) —
                // UNLESS the geometry bears the engine clamp's signature,
                // scrollY pinned at the document bottom, where the fresh
                // read is post-clamp and the stored gap is the only
                // pre-event truth. A silent grow moves the bottom away
                // from the user, so it can never fake the signature.
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
