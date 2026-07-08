import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createBottomAnchor } from '../src/scroll-anchor';
import { INITIAL_KEYBOARD_STATE, type KeyboardState, type KeyboardTracker } from '../src/tracker';

/**
 * Harness: jsdom does no layout, so every geometry the module reads
 * (client/scroll box, scrollTop/scrollY) is a hand-built fake that behaves
 * like a real browser in the three ways the code relies on:
 *
 *   1. a scroll WRITE clamps to the scrollable range and, if it moved,
 *      dispatches 'scroll';
 *   2. shrinking/growing a clientHeight (or scrollHeight) RE-CLAMPS the
 *      stored offset into the new [0, scrollHeight - clientHeight] range and,
 *      if it moved, dispatches 'scroll' — real engines clamp the scroll
 *      offset during layout BEFORE the ResizeObserver/resize callback runs.
 *      This clamp is applied EAGERLY inside `setClientHeight`/`setScrollHeight`
 *      (i.e. before the following `.fire()`/`.resize()`), matching real event
 *      order. The absolute gap-preserving writes in the module are only
 *      idempotent against this clamp — the old harness lacked it and so
 *      silently passed over two double-compensation bugs.
 *   3. `setClientHeight(v, { deferClamp: true })` + `flushClamp()` lets a test
 *      reorder the clamp AFTER the RO tick, to prove the absolute write is
 *      correct in both event orders.
 *
 * ResizeObserver is mocked so element ticks fire on command; the keyboard
 * tracker is injected so overlay-mode inset changes fire on command too.
 */

// ---- ResizeObserver mock -------------------------------------------------

class MockResizeObserver {
    cb: ResizeObserverCallback;
    observed: Element[] = [];
    disconnected = false;
    constructor(cb: ResizeObserverCallback) {
        this.cb = cb;
        roInstances.push(this);
    }
    observe(el: Element): void {
        this.observed.push(el);
    }
    unobserve(): void {}
    disconnect(): void {
        this.disconnected = true;
        this.observed = [];
    }
    fire(): void {
        this.cb([], this as unknown as ResizeObserver);
    }
}

let roInstances: MockResizeObserver[];

function lastRO(): MockResizeObserver {
    return roInstances[roInstances.length - 1];
}

// ---- scrollable element fake --------------------------------------------

interface ClampOpts {
    /** Skip the layout re-clamp so a test can order it after the RO tick. */
    deferClamp?: boolean;
}

interface ScrollableEl extends HTMLDivElement {
    setClientHeight(v: number, opts?: ClampOpts): void;
    setClientWidth(v: number): void;
    setScrollHeight(v: number, opts?: ClampOpts): void;
    /** Apply the deferred layout clamp explicitly. */
    flushClamp(): void;
}

function makeScrollable({ clientHeight, scrollHeight, clientWidth = 300 }: {
    clientHeight: number; scrollHeight: number; clientWidth?: number;
}): ScrollableEl {
    const el = document.createElement('div') as ScrollableEl;
    let ch = clientHeight, cw = clientWidth, sh = scrollHeight, st = 0;
    // Re-clamp the stored offset into the current range (layout clamp).
    const clampScroll = () => {
        const max = Math.max(0, sh - ch);
        const clamped = Math.max(0, Math.min(st, max));
        if (clamped !== st) {
            st = clamped;
            el.dispatchEvent(new Event('scroll'));
        }
    };
    Object.defineProperty(el, 'clientHeight', { configurable: true, get: () => ch });
    Object.defineProperty(el, 'clientWidth', { configurable: true, get: () => cw });
    Object.defineProperty(el, 'scrollHeight', { configurable: true, get: () => sh });
    Object.defineProperty(el, 'scrollTop', {
        configurable: true,
        get: () => st,
        set: (v: number) => {
            const max = Math.max(0, sh - ch);
            const clamped = Math.max(0, Math.min(v, max));
            if (clamped !== st) {
                st = clamped;
                el.dispatchEvent(new Event('scroll'));
            }
        },
    });
    el.setClientHeight = (v, opts) => { ch = v; if (!opts?.deferClamp) clampScroll(); };
    el.setClientWidth = (v) => { cw = v; };
    el.setScrollHeight = (v, opts) => { sh = v; if (!opts?.deferClamp) clampScroll(); };
    el.flushClamp = clampScroll;
    document.body.appendChild(el);
    return el;
}

// ---- window / document scroll fake --------------------------------------

interface WindowHarness {
    setClientHeight(v: number): void;
    setScrollHeight(v: number): void;
    /**
     * Grow scrollHeight with NO scroll/resize dispatch — a post body that
     * loads after mount. Growth upward never clamps scrollY, so a real engine
     * fires nothing here either; the module's stored gap goes stale.
     */
    setScrollHeightSilent(v: number): void;
    setInnerWidth(v: number): void;
    setScrollY(v: number): void;
    /** Simulate a user scroll: clamp into range and dispatch 'scroll'. */
    userScroll(v: number): void;
    readonly scrollY: number;
    resize(): void;
}

function makeWindowHarness({ clientHeight = 800, scrollHeight = 2000, scrollY = 0, innerWidth = 390 }: {
    clientHeight?: number; scrollHeight?: number; scrollY?: number; innerWidth?: number;
} = {}): WindowHarness {
    const doc = document.documentElement;
    let ch = clientHeight, sh = scrollHeight, sy = scrollY, iw = innerWidth;
    // Layout clamp: a height change re-pins scrollY into the new range before
    // any resize callback runs.
    const clampScroll = () => {
        const max = Math.max(0, sh - ch);
        const clamped = Math.max(0, Math.min(sy, max));
        if (clamped !== sy) {
            sy = clamped;
            window.dispatchEvent(new Event('scroll'));
        }
    };
    Object.defineProperty(doc, 'clientHeight', { configurable: true, get: () => ch });
    Object.defineProperty(doc, 'scrollHeight', { configurable: true, get: () => sh });
    Object.defineProperty(window, 'scrollY', { configurable: true, get: () => sy });
    Object.defineProperty(window, 'scrollX', { configurable: true, get: () => 0 });
    Object.defineProperty(window, 'innerWidth', { configurable: true, get: () => iw });
    window.scrollTo = ((x?: number, y?: number) => {
        const max = Math.max(0, sh - ch);
        const clamped = Math.max(0, Math.min(y ?? 0, max));
        if (clamped !== sy) {
            sy = clamped;
            window.dispatchEvent(new Event('scroll'));
        }
    }) as unknown as typeof window.scrollTo;
    return {
        setClientHeight: (v) => { ch = v; clampScroll(); },
        setScrollHeight: (v) => { sh = v; clampScroll(); },
        setScrollHeightSilent: (v) => { sh = v; },
        setInnerWidth: (v) => { iw = v; },
        setScrollY: (v) => { sy = v; },
        userScroll: (v) => {
            const max = Math.max(0, sh - ch);
            const clamped = Math.max(0, Math.min(v, max));
            if (clamped !== sy) {
                sy = clamped;
                window.dispatchEvent(new Event('scroll'));
            }
        },
        get scrollY() { return sy; },
        resize: () => { window.dispatchEvent(new Event('resize')); },
    };
}

// ---- injectable keyboard tracker ----------------------------------------

interface FakeTracker {
    tracker: KeyboardTracker;
    state: { insetPx: number; visible: boolean };
    fire(): void;
}

function makeFakeTracker(init: { insetPx?: number; visible?: boolean } = {}): FakeTracker {
    const state: KeyboardState = {
        ...INITIAL_KEYBOARD_STATE,
        insetPx: init.insetPx ?? 0,
        visible: init.visible ?? false,
    };
    const cbs: Array<(s: KeyboardState) => void> = [];
    const tracker: KeyboardTracker = {
        getState: () => state,
        subscribe: (cb) => {
            cbs.push(cb);
            return () => {
                const i = cbs.indexOf(cb);
                if (i >= 0) cbs.splice(i, 1);
            };
        },
        setOverride: () => {},
        destroy: () => {},
    };
    const mutable = state as unknown as { insetPx: number; visible: boolean };
    return {
        tracker,
        state: mutable,
        fire: () => { for (const cb of cbs.slice()) cb(state); },
    };
}

function focusEditable(): HTMLTextAreaElement {
    const ta = document.createElement('textarea');
    document.body.appendChild(ta);
    ta.focus();
    return ta;
}

// jsdom shares one `window` across a file, so window anchors must all be
// detached between tests or their stale resize listeners keep firing.
let detachers: Array<() => void>;

function mount(target: HTMLElement | Window, opts: Parameters<typeof createBottomAnchor>[1]): () => void {
    const detach = createBottomAnchor(target, opts);
    detachers.push(detach);
    return detach;
}

beforeEach(() => {
    roInstances = [];
    detachers = [];
    vi.stubGlobal('ResizeObserver', MockResizeObserver);
});

afterEach(() => {
    for (const d of detachers) d();
    document.body.innerHTML = '';
    vi.unstubAllGlobals();
});

// =========================================================================
// element target
// =========================================================================

describe('element / at-bottom', () => {
    it('scrolls to the bottom on the first ResizeObserver tick (startAtBottom default)', () => {
        const el = makeScrollable({ clientHeight: 500, scrollHeight: 1000 });
        mount(el, { pin: 'at-bottom' });
        lastRO().fire();
        expect(el.scrollTop).toBe(500); // scrollHeight - clientHeight
    });

    it('does not move on attach when startAtBottom is false', () => {
        const el = makeScrollable({ clientHeight: 500, scrollHeight: 1000 });
        mount(el, { pin: 'at-bottom', startAtBottom: false });
        lastRO().fire();
        expect(el.scrollTop).toBe(0);
    });

    it('re-glues an at-bottom user across a shrink', () => {
        const el = makeScrollable({ clientHeight: 500, scrollHeight: 1000 });
        mount(el, { pin: 'at-bottom' });
        lastRO().fire(); // -> scrollTop 500, at bottom
        el.setClientHeight(300); // keyboard steals 200
        lastRO().fire();
        expect(el.scrollTop).toBe(700); // 1000 - 300, still glued to bottom
    });

    it('keeps a scrolled-up user in place across a shrink', () => {
        const el = makeScrollable({ clientHeight: 500, scrollHeight: 1000 });
        mount(el, { pin: 'at-bottom' });
        lastRO().fire();
        el.scrollTop = 100; // user scrolls up (>40 slack from bottom)
        el.setClientHeight(300);
        lastRO().fire();
        expect(el.scrollTop).toBe(100); // untouched
    });

    it('re-glues a glued user to the bottom across a width change (reflow / rotation)', () => {
        // New semantics: on a width-change RO tick the old gap is incomparable,
        // but a user who WAS glued stays glued (re-anchored to the new bottom),
        // and nothing is delta-compensated.
        const el = makeScrollable({ clientHeight: 500, scrollHeight: 1000, clientWidth: 300 });
        mount(el, { pin: 'at-bottom' });
        lastRO().fire(); // -> scrollTop 500 (glued)
        el.setClientWidth(250);
        el.setClientHeight(300);
        lastRO().fire();
        expect(el.scrollTop).toBe(700); // re-glued to the new bottom (1000 - 300)
    });

    it('leaves a scrolled-up user in place across a width change', () => {
        const el = makeScrollable({ clientHeight: 500, scrollHeight: 1000, clientWidth: 300 });
        mount(el, { pin: 'at-bottom' });
        lastRO().fire();
        el.scrollTop = 100; // scrolled up, not glued
        el.setClientWidth(250);
        el.setClientHeight(300);
        lastRO().fire();
        expect(el.scrollTop).toBe(100); // width change never delta-compensates a non-glued user
    });

    // --- regression: geometry-seeded at-bottom state -------------------------
    it('does NOT yank a top reader to the bottom on the first shrink (startAtBottom:false)', () => {
        // The at-bottom state must be seeded from real geometry, not assumed
        // true: a reader mounted at scrollTop 0 with startAtBottom:false is far
        // from the bottom, so a keyboard shrink must leave them where they are.
        const el = makeScrollable({ clientHeight: 500, scrollHeight: 1000 });
        mount(el, { pin: 'at-bottom', startAtBottom: false });
        lastRO().fire(); // seeds gap from geometry (gap 500 > slack), no move
        el.setClientHeight(300); // keyboard opens
        lastRO().fire();
        expect(el.scrollTop).toBe(0); // NOT yanked to 700
    });

    // --- regression: first RO tick reports width 0, real width arrives later --
    it('lands a default-mount user at the bottom when the real width arrives on a later tick', () => {
        // Container reports 0×0 on the first RO tick (not laid out yet), then a
        // later tick delivers the real box. The width-change re-glue must land
        // the glued user at the settled bottom.
        const el = makeScrollable({ clientHeight: 0, scrollHeight: 0, clientWidth: 0 });
        mount(el, { pin: 'at-bottom' }); // startAtBottom default true
        lastRO().fire(); // first tick: 0×0, glued (gap 0)
        el.setScrollHeight(1000);
        el.setClientHeight(500);
        el.setClientWidth(300); // real layout
        lastRO().fire();
        expect(el.scrollTop).toBe(500); // settled at the bottom (1000 - 500)
    });
});

describe('element / always', () => {
    it('preserves the bottom edge for a mid-history user (absolute gap-preserving write)', () => {
        const el = makeScrollable({ clientHeight: 500, scrollHeight: 1000 });
        mount(el, { pin: 'always', startAtBottom: false });
        lastRO().fire(); // establishes lastHeight = 500
        el.scrollTop = 200; // mid history
        el.setClientHeight(300); // shrink by 200
        lastRO().fire();
        expect(el.scrollTop).toBe(400); // 200 content px above the bottom preserved
    });

    it('restores symmetrically on the following grow', () => {
        const el = makeScrollable({ clientHeight: 500, scrollHeight: 1000 });
        mount(el, { pin: 'always', startAtBottom: false });
        lastRO().fire();
        el.scrollTop = 200;
        el.setClientHeight(300);
        lastRO().fire();
        expect(el.scrollTop).toBe(400);
        el.setClientHeight(500); // grow back
        lastRO().fire();
        expect(el.scrollTop).toBe(200); // fold-out restores the original edge
    });

    it('keeps an at-bottom user glued through shrink then grow via clamping', () => {
        const el = makeScrollable({ clientHeight: 500, scrollHeight: 1000 });
        mount(el, { pin: 'always' });
        lastRO().fire(); // -> scrollTop 500 (bottom)
        el.setClientHeight(300);
        lastRO().fire();
        expect(el.scrollTop).toBe(700); // still bottom (1000 - 300)
        el.setClientHeight(500); // grow back; layout clamps 700 -> 500 first
        lastRO().fire();
        expect(el.scrollTop).toBe(500); // absolute write is a no-op against the clamp
    });

    // --- regression (defect 4): width change re-glues a glued 'always' user --
    // Being at the bottom is reflow-invariant, so a glued user must re-anchor
    // to the new bottom in 'always' too (rotation). The old gap is still not
    // delta-compensated — only the glued case moves.
    it('re-glues a glued user to the new bottom on a width change', () => {
        const el = makeScrollable({ clientHeight: 500, scrollHeight: 1000, clientWidth: 300 });
        mount(el, { pin: 'always' });
        lastRO().fire(); // -> scrollTop 500 (glued)
        el.setClientWidth(250);
        el.setClientHeight(300);
        lastRO().fire();
        expect(el.scrollTop).toBe(700); // re-glued to the new bottom (1000 - 300)
    });

    it('leaves a scrolled-up user in place across a width change', () => {
        const el = makeScrollable({ clientHeight: 500, scrollHeight: 1000, clientWidth: 300 });
        mount(el, { pin: 'always' });
        lastRO().fire(); // -> scrollTop 500 (glued)
        el.scrollTop = 100; // scroll up, gap 400 > slack
        el.setClientWidth(250);
        el.setClientHeight(300);
        lastRO().fire();
        expect(el.scrollTop).toBe(100); // reflow never delta-compensates a non-glued user
    });

    // --- regression (defect 1): grow double-compensation at the bottom -------
    // On a keyboard-dismiss grow while glued to the bottom, the engine clamps
    // scrollTop down during layout BEFORE the RO tick. The old relative write
    // ("scrollTop += dismiss delta") then moved a SECOND time, stranding the
    // list ~keyboard-height above the bottom. The absolute write must land the
    // user exactly at the new max regardless of clamp/RO event order.
    it('does not double-compensate on grow at the bottom — clamp fires before the RO tick', () => {
        const el = makeScrollable({ clientHeight: 500, scrollHeight: 1000 });
        mount(el, { pin: 'always' });
        lastRO().fire(); // scrollTop 500 (bottom)
        el.setClientHeight(300); // keyboard opens (steals 200)
        lastRO().fire();
        expect(el.scrollTop).toBe(700); // bottom while open
        el.setClientHeight(500); // keyboard dismisses (grows 200); clamp 700 -> 500 now
        lastRO().fire();
        expect(el.scrollTop).toBe(500); // new max, NOT max - 200 (== 300)
    });

    it('does not double-compensate on grow at the bottom — RO tick before the clamp scroll', () => {
        const el = makeScrollable({ clientHeight: 500, scrollHeight: 1000 });
        mount(el, { pin: 'always' });
        lastRO().fire();
        el.setClientHeight(300);
        lastRO().fire();
        expect(el.scrollTop).toBe(700);
        el.setClientHeight(500, { deferClamp: true }); // grow, but hold the clamp
        lastRO().fire(); // RO runs while scrollTop is still the stale 700
        el.flushClamp(); // engine clamp lands afterwards
        expect(el.scrollTop).toBe(500); // still the new max, no second move
    });

    // --- regression (defect 1): near-bottom fold preserved across the clamp ---
    // A user 60px above the bottom with the keyboard up. On dismiss the grow
    // over-runs the new max, so the engine clamp scroll fires FIRST (while
    // clientHeight already reports the new height). onScroll must ignore that
    // in-flight clamp, or it re-baselines the stored gap to 0 and the RO tick
    // snaps the user to the exact bottom instead of preserving the 60px fold.
    it('preserves a 60px fold on grow when the clamp scroll fires before the RO tick', () => {
        const el = makeScrollable({ clientHeight: 800, scrollHeight: 2000 });
        mount(el, { pin: 'always' });
        lastRO().fire(); // -> scrollTop 1200 (bottom)
        el.setClientHeight(500); // keyboard opens (steals 300)
        lastRO().fire();
        expect(el.scrollTop).toBe(1500); // bottom while open (2000 - 500)
        el.scrollTop = 1440; // user scrolls up 60px from the bottom -> gap 60
        el.setClientHeight(800); // dismiss grows; clamp 1440 -> new max 1200 fires first
        lastRO().fire();
        expect(el.scrollTop).toBe(1140); // max - 60, fold preserved (NOT 1200)
    });
});

// =========================================================================
// window target
// =========================================================================

describe('window / always', () => {
    it('compensates a shrink while an editable is focused and undoes it on grow', () => {
        const kb = makeFakeTracker();
        const h = makeWindowHarness({ clientHeight: 800, scrollHeight: 2000, scrollY: 500 });
        focusEditable();
        mount(window, { pin: 'always', tracker: kb.tracker });

        h.setClientHeight(500); // keyboard 300
        h.resize();
        expect(h.scrollY).toBe(800); // 500 + 300

        h.setClientHeight(800); // keyboard closes
        h.resize();
        expect(h.scrollY).toBe(500); // undone
    });

    it('ignores an unfocused chrome shrink and its matching grow (no drift)', () => {
        const kb = makeFakeTracker({ insetPx: 0, visible: false });
        const h = makeWindowHarness({ clientHeight: 800, scrollHeight: 2000, scrollY: 500 });
        mount(window, { pin: 'always', tracker: kb.tracker });

        h.setClientHeight(740); // URL bar reveals, 60px, no focus/keyboard
        h.resize();
        expect(h.scrollY).toBe(500); // gate closed

        h.setClientHeight(800); // URL bar hides again
        h.resize();
        expect(h.scrollY).toBe(500); // no phantom debt to give back
    });

    it('caps the grow undo at the shrink actually applied', () => {
        const kb = makeFakeTracker();
        const h = makeWindowHarness({ clientHeight: 800, scrollHeight: 2000, scrollY: 0 });
        focusEditable();
        mount(window, { pin: 'always', tracker: kb.tracker });

        h.setClientHeight(500); // shrink 300 from the top
        h.resize();
        expect(h.scrollY).toBe(300); // outstanding debt = 300

        h.setClientHeight(900); // grows 400 (> keyboard: URL bar hid too)
        h.resize();
        expect(h.scrollY).toBe(0); // undo capped at 300, clamps to top, no over-scroll
    });

    it('drops the debt on an orientation (width) change', () => {
        const kb = makeFakeTracker();
        const h = makeWindowHarness({ clientHeight: 800, scrollHeight: 2000, scrollY: 0, innerWidth: 390 });
        focusEditable();
        mount(window, { pin: 'always', tracker: kb.tracker });

        h.setClientHeight(500);
        h.resize();
        expect(h.scrollY).toBe(300); // debt built

        h.setInnerWidth(800); // rotate
        h.resize();
        expect(h.scrollY).toBe(300); // orientation evaluate moves nothing

        h.setClientHeight(800); // a grow that WOULD undo if debt survived
        h.resize();
        expect(h.scrollY).toBe(300); // debt was reset -> no undo
    });

    it('compensates an overlay-mode inset change (clientHeight fixed) the same way', () => {
        const kb = makeFakeTracker({ insetPx: 0, visible: true });
        const h = makeWindowHarness({ clientHeight: 800, scrollHeight: 2000, scrollY: 500 });
        mount(window, { pin: 'always', tracker: kb.tracker });

        kb.state.insetPx = 300; // overlay keyboard occludes 300, layout unchanged
        kb.fire(); // tracker subscriber drives evaluate
        expect(h.scrollY).toBe(800); // effectiveHeight fell 300 -> same compensation
    });

    // --- regression (defect 2): grow double-compensation at document bottom ---
    // Same shape as defect 1 but for the window anchor: at the document bottom
    // the layout clamp restores the glued user on grow BEFORE the resize
    // callback, so the absolute write must be a no-op, not a second delta.
    //
    // This also pins the round-5 clamp-signature fallback: the grow branch
    // normally prefers a FRESH baseline, but here the geometry bears the engine
    // clamp's signature (scrollY pinned at the document bottom, scrollY >=
    // maxScroll - 1), so it must fall back to the STORED gap. The fresh read
    // would be post-clamp (2000 - 1200 - 500 = 300) and land the page at 900 —
    // a second move; the stored gap (0) is the only pre-event truth and lands
    // it back at the true bottom.
    it('does not double-compensate a focused shrink/grow at the document bottom (clamp-signature stored-gap path)', () => {
        const kb = makeFakeTracker();
        const h = makeWindowHarness({ clientHeight: 800, scrollHeight: 2000, scrollY: 1200 }); // bottom
        focusEditable();
        mount(window, { pin: 'always', tracker: kb.tracker });

        h.setClientHeight(500); // keyboard 300
        h.resize();
        expect(h.scrollY).toBe(1500); // bottom while open (max 1500)

        h.setClientHeight(800); // keyboard dismisses; clamp 1500 -> 1200 fires first (the signature)
        h.resize();
        expect(h.scrollY).toBe(1200); // stored-gap fallback, NOT 900 (fresh-baseline double move)
    });

    // --- regression (defect 3): clamped fold-out must not strand debt ---------
    // A fold-out that clamps at scrollY 0 achieves less movement than the debt.
    // Draining debt by ACHIEVED movement leaves debt > 0 forever, holding the
    // keyboardish gate open so later URL-bar chrome noise drifts the page.
    // Nominal draining (debt -= min(growth, debt)) fully clears it.
    it('drains debt nominally when the fold-out clamps at the top (no later chrome drift)', () => {
        const kb = makeFakeTracker();
        const h = makeWindowHarness({ clientHeight: 800, scrollHeight: 2000, scrollY: 0 });
        const ta = focusEditable();
        mount(window, { pin: 'always', tracker: kb.tracker });

        h.setClientHeight(500); // keyboard opens, shrink 300 (focused)
        h.resize();
        expect(h.scrollY).toBe(300); // compensated, debt = 300

        h.userScroll(20); // user scrolls back up near the top
        expect(h.scrollY).toBe(20);

        ta.remove(); // blur (focus element unmounts)
        h.setClientHeight(800); // keyboard dismisses, grow 300; fold-out clamps at 0
        h.resize();
        expect(h.scrollY).toBe(0); // clamped at the top; debt drained nominally to 0

        h.setClientHeight(740); // later unfocused URL-bar chrome shrink (60)
        h.resize();
        expect(h.scrollY).toBe(0); // gate closed (debt == 0) -> NOT dragged down
    });

    // --- regression (defect 2): overlay carry ledger repays the un-foldable px --
    // An overlay host at the document bottom cannot scroll past the physical
    // edge, so the fold-in clamps and the stored gap absorbs the un-foldable
    // px. Without the carry ledger, fold-out replays that gap and drifts the
    // page up by ~keyboard-height. The carry records the clamped shortfall and
    // fold-out subtracts it, returning the page to its true edge.
    it('repays the clamped fold on fold-out at the document bottom (overlay host)', () => {
        const kb = makeFakeTracker({ insetPx: 0, visible: true });
        const h = makeWindowHarness({ clientHeight: 800, scrollHeight: 2000, scrollY: 1200 }); // bottom, max 1200
        mount(window, { pin: 'always', tracker: kb.tracker });

        kb.state.insetPx = 300; // fold-in: effectiveHeight 800 -> 500, clamps at max 1200
        kb.fire();
        expect(h.scrollY).toBe(1200); // could not scroll past the edge (carry = 300)

        kb.state.insetPx = 0; // fold-out
        kb.fire();
        expect(h.scrollY).toBe(1200); // back at the true bottom (carry repaid), NOT 900
    });

    it('repays the clamped fold for a near-bottom overlay user (gap 60)', () => {
        const kb = makeFakeTracker({ insetPx: 0, visible: true });
        // scrollY 1140 = 60px above the bottom (max 1200).
        const h = makeWindowHarness({ clientHeight: 800, scrollHeight: 2000, scrollY: 1140 });
        mount(window, { pin: 'always', tracker: kb.tracker });

        kb.state.insetPx = 300; // fold-in clamps at the edge, part of the fold un-foldable
        kb.fire();
        expect(h.scrollY).toBe(1200);

        kb.state.insetPx = 0; // fold-out
        kb.fire();
        expect(h.scrollY).toBe(1140); // returns to the true gap (max - 60), NOT 900
    });

    // --- regression (defect 3): SHRINK baseline read fresh, survives silent grow --
    // Content loads after mount and grows scrollHeight with no scroll/resize
    // event, so the stored gap is stale (still ~0). The first keyboard shrink
    // must read the gap FRESH against the pre-event height (a shrink is never
    // engine-clamped) and fold by the keyboard height, not jump to the new
    // document bottom off the stale stored gap.
    it('folds by the keyboard height after a silent content grow (fresh shrink baseline)', () => {
        const kb = makeFakeTracker();
        const h = makeWindowHarness({ clientHeight: 800, scrollHeight: 800, scrollY: 0 }); // short doc, gap ~0
        mount(window, { pin: 'always', tracker: kb.tracker });

        h.setScrollHeightSilent(2800); // post body loads: +2000, no event -> stored gap stale
        focusEditable();

        h.setClientHeight(500); // keyboard opens, shrink 300 (focused)
        h.resize();
        expect(h.scrollY).toBe(300); // folded by 300 off the FRESH gap, NOT jumped to 2300
    });
});

describe('window / at-bottom', () => {
    it('compensates a shrink only when the user is at the bottom', () => {
        // At bottom: compensated.
        const kb1 = makeFakeTracker();
        const bottom = makeWindowHarness({ clientHeight: 800, scrollHeight: 2000, scrollY: 1200 });
        focusEditable();
        const detach1 = mount(window, { pin: 'at-bottom', tracker: kb1.tracker });
        bottom.setClientHeight(500);
        bottom.resize();
        expect(bottom.scrollY).toBe(1500); // 1200 + 300, glued to bottom
        detach1();
    });

    it('does not compensate a shrink when the user is mid-page', () => {
        const kb = makeFakeTracker();
        const mid = makeWindowHarness({ clientHeight: 800, scrollHeight: 2000, scrollY: 500 });
        focusEditable();
        mount(window, { pin: 'at-bottom', tracker: kb.tracker });
        mid.setClientHeight(500);
        mid.resize();
        expect(mid.scrollY).toBe(500); // not at bottom -> untouched
    });

    it('drains the debt on keyboard close so a later unfocused shrink does not drift', () => {
        const kb = makeFakeTracker();
        const h = makeWindowHarness({ clientHeight: 800, scrollHeight: 2000, scrollY: 1200 });
        const ta = focusEditable();
        mount(window, { pin: 'at-bottom', tracker: kb.tracker });

        h.setClientHeight(500); // keyboard opens at bottom
        h.resize();
        expect(h.scrollY).toBe(1500); // debt = 300

        ta.remove(); // keyboard closes, focus gone
        h.setClientHeight(800); // layout grows back; clamp restores the glued user to 1200
        h.resize();
        // 'at-bottom' grow drains the debt nominally without its own scroll write.
        expect(h.scrollY).toBe(1200); // engine clamp re-anchored to the new bottom

        h.setClientHeight(740); // later URL-bar chrome shrink, still unfocused
        h.resize();
        expect(h.scrollY).toBe(1200); // gate closed (debt drained) -> no drift
    });
});

// =========================================================================
// round-4 regressions
// =========================================================================

describe('round-4 regressions', () => {
    // --- fix 1: a live user drag during a multi-frame grow is respected ------
    // Keyboard dismissal grows the box over several frames. Each grow tick runs
    // AFTER the frame's scroll steps, so if the onScroll guard swallowed every
    // scroll while a grow was in flight, the stored gap would be frozen and each
    // tick would yank the user back to their pre-dismiss position, fighting the
    // drag. The guard must swallow ONLY the engine clamp (grow in flight AND
    // landing exactly at the new bottom); a mid-range user drag re-baselines the
    // stored gap live, so the tick preserves where the user actually is.
    it('preserves a live user drag through a multi-frame grow (always)', () => {
        const el = makeScrollable({ clientHeight: 500, scrollHeight: 2000 });
        mount(el, { pin: 'always', startAtBottom: false });
        lastRO().fire(); // lastHeight = 500
        el.scrollTop = 1200; // mid-history, keyboard up -> gap 300
        // Frame 1: box grows 500 -> 600 (clamp leaves a mid-range scrollTop put),
        // then the user drags to a new mid-range spot BEFORE the RO delivers.
        el.setClientHeight(600);
        el.scrollTop = 1000; // user drag -> gap 400, readGap far from 0 -> not swallowed
        lastRO().fire();
        expect(el.scrollTop).toBe(1000); // the user's gap 400, NOT reverted to 300 (->1100)
        // Frame 2: same again, proving no fight across successive grow ticks.
        el.setClientHeight(700);
        el.scrollTop = 900; // user drag -> gap 400
        lastRO().fire();
        expect(el.scrollTop).toBe(900); // still the user's position, NOT 300 (->1000)
    });

    // --- fix 1 (negative): the guard is grow-only; shrinks re-baseline --------
    // The 60px-fold test above proves a clamp landing at the bottom is swallowed
    // during a GROW. The mirror: during a SHRINK in flight (clientHeight already
    // below lastHeight, RO not yet delivered) a user scroll — even one landing
    // exactly at the new bottom, which the grow guard WOULD swallow — must
    // re-baseline the stored gap, because a shrink is never engine-clamped so
    // any scroll is genuinely the user.
    it('re-baselines a shrink-in-flight scroll that lands at the bottom (guard is grow-only)', () => {
        const el = makeScrollable({ clientHeight: 500, scrollHeight: 2000 });
        mount(el, { pin: 'always', startAtBottom: false });
        lastRO().fire(); // lastHeight = 500
        el.scrollTop = 1200; // keyboard-up mid-history -> gap 300
        // Shrink in flight: box drops 500 -> 300, RO not delivered (lastHeight
        // still 500). User drags to the NEW bottom during that window.
        el.setClientHeight(300);
        el.scrollTop = 1700; // new bottom, readGap 0 -> a GROW would swallow this
        // clientHeight(300) < lastHeight(500), so the guard lets it through and
        // gap re-baselines to 0. Observe via the following dismiss grow, which
        // reads the stored gap.
        el.setClientHeight(800); // grow; clamp 1700 -> new max 1200 fires (swallowed)
        lastRO().fire();
        expect(el.scrollTop).toBe(1200); // folded out off gap 0, NOT 900 (stale gap 300)
    });

    // --- fix 2: writeGap forces an instant scroll and restores the prior value -
    // Under a consumer's `scroll-behavior: smooth` the window write would animate
    // asynchronously, so the carry readback right after it would measure a
    // phantom shortfall and drift the page. writeGap must set the scroller's
    // inline scrollBehavior to 'auto' for the duration of the scrollTo, then
    // restore whatever inline value was there before. (scrollingElement is
    // undefined under jsdom, so the scroller is documentElement — matching the
    // source's `document.scrollingElement ?? doc`.)
    it('forces scrollBehavior:auto during the write and restores the default afterwards', () => {
        const de = document.documentElement;
        de.style.scrollBehavior = ''; // no consumer preset
        const kb = makeFakeTracker();
        const h = makeWindowHarness({ clientHeight: 800, scrollHeight: 2000, scrollY: 500 });
        const orig = window.scrollTo;
        let seen: string | undefined;
        window.scrollTo = ((x?: number, y?: number) => {
            seen = de.style.scrollBehavior; // sampled synchronously inside the write
            return (orig as (x?: number, y?: number) => void)(x, y);
        }) as typeof window.scrollTo;
        focusEditable();
        mount(window, { pin: 'always', tracker: kb.tracker });

        h.setClientHeight(500); // focused shrink drives writeGap
        h.resize();
        expect(h.scrollY).toBe(800); // compensation happened (write ran)
        expect(seen).toBe('auto'); // instant, not the consumer's behavior
        expect(de.style.scrollBehavior).toBe(''); // restored to the prior inline value
        window.scrollTo = orig;
    });

    it('restores a consumer preset scrollBehavior:smooth after the forced write', () => {
        const de = document.documentElement;
        de.style.scrollBehavior = 'smooth'; // consumer preset
        const kb = makeFakeTracker();
        const h = makeWindowHarness({ clientHeight: 800, scrollHeight: 2000, scrollY: 500 });
        const orig = window.scrollTo;
        let seen: string | undefined;
        window.scrollTo = ((x?: number, y?: number) => {
            seen = de.style.scrollBehavior;
            return (orig as (x?: number, y?: number) => void)(x, y);
        }) as typeof window.scrollTo;
        focusEditable();
        mount(window, { pin: 'always', tracker: kb.tracker });

        h.setClientHeight(500);
        h.resize();
        expect(h.scrollY).toBe(800);
        expect(seen).toBe('auto'); // forced instant even under smooth
        expect(de.style.scrollBehavior).toBe('smooth'); // preset restored, not clobbered
        window.scrollTo = orig;
        de.style.scrollBehavior = ''; // avoid leaking into other tests
    });
});

// =========================================================================
// round-5 regressions
// =========================================================================

describe('round-5 regressions', () => {
    // --- the round-4 confirmed defect: a silent document grow under an open
    // keyboard must not hijack the fold-out. The window GROW branch used to
    // trust the STORED gap unconditionally; if the document grew with no event
    // while the keyboard was up (a placeholder->data swap, a post body
    // resolving), that gap was stale and dismissal jumped the page toward the
    // new document bottom. Round 5 prefers a FRESH baseline
    // (scrollHeight - scrollY - prevHeight) unless the geometry bears the engine
    // clamp's signature (scrollY pinned at the document bottom). A silent grow
    // moves the bottom away from the user, so it can never fake the signature.
    it('folds out from the current position after a silent grow, not toward the new bottom (always)', () => {
        const kb = makeFakeTracker();
        const h = makeWindowHarness({ clientHeight: 800, scrollHeight: 850, scrollY: 0 }); // short doc, gap ~50
        focusEditable();
        mount(window, { pin: 'always', tracker: kb.tracker });

        h.setClientHeight(500); // keyboard opens, focused shrink 300
        h.resize();
        expect(h.scrollY).toBe(300); // folded to the bottom edge, debt = 300

        h.setScrollHeightSilent(3000); // content resolves under the open keyboard, no event -> stored gap (50) stale

        h.setClientHeight(800); // keyboard dismisses, grow 300; scrollY 300 is far from the new bottom (max 2200)
        h.resize();
        // Fresh baseline 3000 - 300 - 500 = 2200 folds back out by 300 to
        // scrollY 0. The stale stored gap (50) would have written toward the
        // new document bottom (y = 3000 - 800 - 50 = 2150).
        expect(h.scrollY).toBe(0);
    });

    // --- composer auto-grow variant: a textarea growing a few px under the open
    // keyboard is the same stale-stored-gap mechanism at small scale. A 66px
    // growth would leak into the restored position off the stored gap; the fresh
    // baseline restores the exact pre-open scroll position with no drift.
    it('restores the exact pre-open position after a 66px composer auto-grow (no drift, always)', () => {
        const kb = makeFakeTracker();
        const h = makeWindowHarness({ clientHeight: 800, scrollHeight: 2000, scrollY: 500 }); // mid-page
        focusEditable();
        mount(window, { pin: 'always', tracker: kb.tracker });

        h.setClientHeight(500); // keyboard opens, focused shrink 300
        h.resize();
        expect(h.scrollY).toBe(800); // folded up (500 + 300), gap 700 preserved

        h.setScrollHeightSilent(2066); // composer auto-grows 66px, no event

        h.setClientHeight(800); // keyboard dismisses, grow 300
        h.resize();
        // Fresh baseline 2066 - 800 - 500 = 766 restores scrollY 500 exactly;
        // the stale stored gap (700) would land at 566, drifted up by the 66px.
        expect(Math.abs(h.scrollY - 500)).toBeLessThanOrEqual(1);
    });
});

// =========================================================================
// cleanup
// =========================================================================

describe('cleanup', () => {
    it('detaches the window anchor: later events move nothing', () => {
        const kb = makeFakeTracker();
        const h = makeWindowHarness({ clientHeight: 800, scrollHeight: 2000, scrollY: 500 });
        focusEditable();
        const detach = mount(window, { pin: 'always', tracker: kb.tracker });
        detach();

        h.setClientHeight(500);
        h.resize(); // resize listener removed
        kb.state.insetPx = 300;
        kb.fire(); // subscriber removed
        expect(h.scrollY).toBe(500); // untouched
    });

    it('detaches the element anchor: the ResizeObserver is disconnected', () => {
        const el = makeScrollable({ clientHeight: 500, scrollHeight: 1000 });
        const detach = mount(el, { pin: 'always' });
        const ro = lastRO();
        ro.fire();
        detach();
        expect(ro.disconnected).toBe(true);
    });
});
