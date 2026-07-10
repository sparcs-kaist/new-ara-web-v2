/**
 * Soft-keyboard inset tracker.
 *
 *   occlusion = innerHeight − visualViewport.height − visualViewport.offsetTop
 *
 * i.e. the CSS px of the layout viewport's bottom edge covered by the
 * keyboard — the exact lift a `position: fixed; bottom: 0` element needs
 * (0 on hosts that resize the layout viewport instead). Raw occlusion is
 * not trustworthy on real devices, so on top of the formula: the inset is
 * gated on an editable actually owning focus (iOS reports stale geometry
 * for up to ~1s after dismissal; iOS 26.0 leaves a ~24px residue forever,
 * WebKit #297779), focus is re-derived from `document.activeElement` each
 * evaluation (no blur event fires when the focused element unmounts),
 * samples must agree across two consecutive frames (Android's per-frame
 * IME animation skews innerHeight vs vv.height), and visibility is a latch
 * released only on blur or on vv.height returning ≈ innerHeight (a
 * Chromium visual-viewport pan drives occlusion to 0 mid-presentation).
 * See the README for the full behavior matrix.
 */

export type KeyboardViewportMode = 'resize' | 'overlay' | 'unknown';

export interface KeyboardState {
    /**
     * A keyboard (or an inset-producing accessory bar) is currently
     * presented — i.e. it either occludes the layout viewport or has
     * resized it.
     */
    visible: boolean;
    /**
     * CSS px of the layout viewport bottom occluded by the keyboard.
     * Lift `position: fixed; bottom: 0` elements by exactly this much.
     * Always 0 when the layout viewport itself was resized (`mode: 'resize'`).
     */
    insetPx: number;
    /** How the current runtime reacted to the active presentation. */
    mode: KeyboardViewportMode;
    /**
     * Height of the visual viewport in CSS px (falls back to innerHeight).
     * Pan-invariant — size full-screen containers (chat) from this.
     */
    visualHeight: number;
    /** An editable element owns focus (re-derived from activeElement). */
    editableFocused: boolean;
    /** Where insetPx came from. */
    source: 'geometry' | 'override';
}

export interface KeyboardTrackerOptions {
    /**
     * Minimum px delta attributed to a keyboard rather than to browser
     * chrome (URL bar) noise. Default 50.
     */
    minKeyboardHeight?: number;
    /**
     * Residues at or below this are clamped to 0 when no keyboard is
     * latched (iOS 26 leaves ~24px after dismissal). Default 32.
     */
    residualEpsilon?: number;
    /**
     * On iOS WebKit, force a no-op scroll write-back after dismissal to
     * unstick the layout viewport (WebKit #192564). Default true.
     * Never touches focus.
     */
    iosDismissFix?: boolean;
}

export interface KeyboardTracker {
    getState(): KeyboardState;
    /** Callback fires with the new state after each change. Returns unsubscribe. */
    subscribe(cb: (state: KeyboardState) => void): () => void;
    /**
     * Feed a native keyboard height (raw CSS px as reported by the host OS),
     * e.g. from a WebView bridge. The tracker normalizes it against any
     * observed layout-viewport shrink, so a host whose WebView already
     * resizes with the keyboard contributes ~0 — a raw-height override can
     * never double-lift. Pass null to return to geometry.
     */
    setOverride(rawKeyboardPx: number | null): void;
    destroy(): void;
}

export const INITIAL_KEYBOARD_STATE: KeyboardState = Object.freeze({
    visible: false,
    insetPx: 0,
    mode: 'unknown' as KeyboardViewportMode,
    visualHeight: 0,
    editableFocused: false,
    source: 'geometry' as const,
});

const NON_EDITABLE_INPUT_TYPES = new Set([
    'button', 'submit', 'reset', 'checkbox', 'radio', 'file', 'image', 'range', 'color', 'hidden',
]);

export function isEditableElement(el: Element | null): boolean {
    if (!el || !(el instanceof HTMLElement)) return false;
    if (el.isContentEditable) return true;
    const tag = el.tagName;
    if (tag === 'TEXTAREA' || tag === 'SELECT') return true;
    if (tag === 'INPUT') return !NON_EDITABLE_INPUT_TYPES.has((el as HTMLInputElement).type);
    return false;
}

function isIOSWebKit(): boolean {
    if (typeof navigator === 'undefined') return false;
    const ua = navigator.userAgent;
    return /iPhone|iPad|iPod/.test(ua)
        // iPadOS 13+ masquerades as macOS but exposes multi-touch.
        || (/Macintosh/.test(ua) && typeof navigator.maxTouchPoints === 'number' && navigator.maxTouchPoints > 1);
}

/** Samples within this many px of each other count as "stable". */
const STABILITY_TOLERANCE_PX = 8;

interface Presentation {
    /** innerHeight at the moment focus was gained with no keyboard up. */
    baselineInnerHeight: number;
    mode: KeyboardViewportMode;
    /** Keyboard was observed at some point during this presentation. */
    latched: boolean;
}

class DomKeyboardTracker implements KeyboardTracker {
    private readonly minKeyboardHeight: number;
    private readonly residualEpsilon: number;
    private readonly iosDismissFix: boolean;

    private readonly listeners = new Set<(s: KeyboardState) => void>();
    private state: KeyboardState = INITIAL_KEYBOARD_STATE;

    private presentation: Presentation | null = null;
    private overrideRaw: number | null = null;
    private lastSample = -1;
    private stableOcclusion = 0;
    private lastInnerWidth = -1;
    /** Largest innerHeight seen at the current width — the unshrunk layout
     *  height, independent of focus lifecycle. Overrides normalize against
     *  it so they hold even when no presentation is active or focus arrived
     *  after the host already resized. */
    private maxInnerHeight = 0;
    private rafId: number | null = null;
    private attached = false;
    private destroyed = false;

    constructor(opts: KeyboardTrackerOptions = {}) {
        this.minKeyboardHeight = opts.minKeyboardHeight ?? 50;
        this.residualEpsilon = opts.residualEpsilon ?? 32;
        this.iosDismissFix = opts.iosDismissFix ?? true;
    }

    getState(): KeyboardState {
        return this.state;
    }

    subscribe(cb: (state: KeyboardState) => void): () => void {
        if (this.destroyed) return () => {};
        this.listeners.add(cb);
        if (!this.attached) this.attach();
        return () => {
            this.listeners.delete(cb);
            if (this.listeners.size === 0) this.detach();
        };
    }

    setOverride(rawKeyboardPx: number | null): void {
        this.overrideRaw = rawKeyboardPx;
        // Host-driven overrides arrive per frame; publish synchronously so
        // the lift lands in the same task instead of one rAF later.
        if (this.attached && !this.destroyed) {
            this.evaluate();
        } else {
            this.schedule();
        }
    }

    destroy(): void {
        this.detach();
        this.listeners.clear();
        this.destroyed = true;
    }

    // ---- internals -------------------------------------------------------

    private readonly schedule = (): void => {
        if (this.rafId !== null || this.destroyed) return;
        this.rafId = requestAnimationFrame(() => {
            this.rafId = null;
            this.evaluate();
        });
    };

    private attach(): void {
        if (this.attached || typeof window === 'undefined') return;
        this.attached = true;
        const vv = window.visualViewport;
        vv?.addEventListener('resize', this.schedule);
        vv?.addEventListener('scroll', this.schedule);
        window.addEventListener('resize', this.schedule);
        window.addEventListener('focusin', this.schedule);
        window.addEventListener('focusout', this.schedule);
        this.lastInnerWidth = window.innerWidth;
        this.schedule();
    }

    private detach(): void {
        if (!this.attached) return;
        this.attached = false;
        const vv = window.visualViewport;
        vv?.removeEventListener('resize', this.schedule);
        vv?.removeEventListener('scroll', this.schedule);
        window.removeEventListener('resize', this.schedule);
        window.removeEventListener('focusin', this.schedule);
        window.removeEventListener('focusout', this.schedule);
        if (this.rafId !== null) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
        }
    }

    private evaluate(): void {
        const vv = window.visualViewport;
        const innerHeight = window.innerHeight;
        const innerWidth = window.innerWidth;
        const visualHeight = vv ? vv.height : innerHeight;
        const offsetTop = vv ? vv.offsetTop : 0;
        // Focus is re-derived every evaluation: focusin/focusout alone go
        // stale when the focused element unmounts (no blur event fires).
        const focused = isEditableElement(document.activeElement);
        const rawOcclusion = Math.max(0, Math.round(innerHeight - visualHeight - offsetTop));

        // Orientation / window resize: geometry baselines are meaningless
        // across a width change; restart the presentation from here.
        if (innerWidth !== this.lastInnerWidth) {
            this.lastInnerWidth = innerWidth;
            this.presentation = focused
                ? { baselineInnerHeight: innerHeight, mode: 'unknown', latched: false }
                : null;
            this.lastSample = -1;
            this.stableOcclusion = 0;
            this.maxInnerHeight = 0;
        }
        this.maxInnerHeight = Math.max(this.maxInnerHeight, innerHeight);

        // Occlusion stability: trust a sample only when two consecutive
        // evaluations agree (filters the 1–2 frame innerHeight/vv.height skew
        // during Android's per-frame IME animation). Re-evaluate until stable.
        if (this.lastSample >= 0 && Math.abs(rawOcclusion - this.lastSample) <= STABILITY_TOLERANCE_PX) {
            this.stableOcclusion = rawOcclusion;
        } else {
            this.schedule();
        }
        this.lastSample = rawOcclusion;

        // Presentation lifecycle. A focus transfer between two fields never
        // shows up here as unfocused (both events settle before our rAF), so
        // the baseline survives transfers while the keyboard stays up.
        if (focused && this.presentation === null) {
            this.presentation = { baselineInnerHeight: innerHeight, mode: 'unknown', latched: false };
        } else if (!focused && this.presentation !== null) {
            this.presentation = null;
            this.lastSample = -1;
            this.stableOcclusion = 0;
            if (this.iosDismissFix && isIOSWebKit()) {
                // WebKit #192564: dismissal can leave the viewport panned.
                // No-op scroll write-back (values read inside the callback,
                // so it stays a no-op across navigations); never blurs.
                requestAnimationFrame(() => {
                    window.scrollTo(window.scrollX, window.scrollY);
                });
            }
        }

        let mode: KeyboardViewportMode = 'unknown';
        let latched = false;
        if (this.presentation !== null) {
            const p = this.presentation;
            const layoutShrank = Math.max(0, p.baselineInnerHeight - innerHeight);
            if (layoutShrank >= this.minKeyboardHeight) {
                p.mode = 'resize';
            } else if (p.mode !== 'resize' && rawOcclusion >= this.minKeyboardHeight) {
                p.mode = 'overlay';
            }
            if (layoutShrank >= this.minKeyboardHeight || rawOcclusion >= this.minKeyboardHeight) {
                p.latched = true;
            } else if (
                p.latched
                && layoutShrank <= this.residualEpsilon
                && innerHeight - visualHeight <= this.residualEpsilon
            ) {
                // Closed-with-focus-retained (iPad keyboard-hide key):
                // vv.height is back ≈ innerHeight. A fully-panned viewport
                // (occlusion 0, vv.height still short) does NOT release.
                p.latched = false;
                p.mode = 'unknown';
            }
            mode = p.mode;
            latched = p.latched;
        }

        // Every branch is gated on focus so a stale geometry reading can
        // never park a nonzero inset on a keyboard-less page.
        let insetPx = 0;
        let source: KeyboardState['source'] = 'geometry';
        let visible = latched;
        if (this.overrideRaw !== null) {
            // Raw native height minus observed layout shrink — a resize-mode
            // host contributes ~0 instead of double-lifting. Measured from the
            // width-scoped max innerHeight so it holds without focus.
            const layoutShrank = Math.max(0, this.maxInnerHeight - innerHeight);
            insetPx = Math.max(0, Math.round(this.overrideRaw - layoutShrank));
            source = 'override';
            visible = insetPx > 0 || latched;
        } else if (latched) {
            insetPx = mode === 'resize'
                // Viewport already sits on the keyboard; report only a
                // stable residue (hybrid hosts that resize AND inset).
                ? (this.stableOcclusion > this.residualEpsilon ? this.stableOcclusion : 0)
                : this.stableOcclusion;
        } else if (focused && this.stableOcclusion > this.residualEpsilon) {
            // Sub-threshold occlusion with focus held: hardware-keyboard
            // accessory bars (~44–69px) really do occlude.
            insetPx = this.stableOcclusion;
        }

        this.publish({
            visible,
            insetPx,
            mode,
            visualHeight: Math.round(visualHeight),
            editableFocused: focused,
            source,
        });
    }

    private publish(next: KeyboardState): void {
        const prev = this.state;
        if (
            prev.visible === next.visible
            && prev.insetPx === next.insetPx
            && prev.mode === next.mode
            && prev.visualHeight === next.visualHeight
            && prev.editableFocused === next.editableFocused
            && prev.source === next.source
        ) {
            return;
        }
        this.state = Object.freeze(next);
        for (const cb of this.listeners) cb(this.state);
    }
}

class InertKeyboardTracker implements KeyboardTracker {
    getState(): KeyboardState {
        return INITIAL_KEYBOARD_STATE;
    }
    subscribe(): () => void {
        return () => {};
    }
    setOverride(): void {}
    destroy(): void {}
}

export function createKeyboardTracker(opts?: KeyboardTrackerOptions): KeyboardTracker {
    if (typeof window === 'undefined') return new InertKeyboardTracker();
    return new DomKeyboardTracker(opts);
}

// The shared instance lives on globalThis so HMR module duplication in dev
// cannot end up with two trackers double-listening on the same window.
const SHARED_KEY = Symbol.for('@sparcs-kaist/keyboard-inset:shared');

interface SharedSlot {
    tracker: KeyboardTracker;
}

/**
 * Lazily-created shared tracker (what the React hooks use by default).
 * `destroy()` on the shared instance resets the slot; the next call
 * recreates a fresh tracker.
 */
export function getSharedKeyboardTracker(): KeyboardTracker {
    if (typeof window === 'undefined') return new InertKeyboardTracker();
    const g = globalThis as Record<PropertyKey, unknown>;
    let slot = g[SHARED_KEY] as SharedSlot | undefined;
    if (!slot) {
        const real = new DomKeyboardTracker();
        const shared: KeyboardTracker = {
            getState: () => real.getState(),
            subscribe: (cb) => real.subscribe(cb),
            setOverride: (px) => real.setOverride(px),
            destroy: () => {
                real.destroy();
                delete g[SHARED_KEY];
            },
        };
        slot = { tracker: shared };
        g[SHARED_KEY] = slot;
    }
    return slot.tracker;
}
