// Reports land in one late jump, so consumers snap: ease insetPx / visualHeight / layoutHeight toward them.

import { getSharedKeyboardTracker, type KeyboardState, type KeyboardTracker } from './tracker';

export interface KeyboardGlideOptions {
    glide?: boolean;
    glideThresholdPx?: number;
    glideDurationMs?: number;
}

type Triple = [number, number, number];
/** `m0` is the start tangent in px per segment (dp/dt, t in [0,1]); the end tangent is 0. */
interface Glide { from: Triple; m0: Triple; to: Triple; startedAt: number; duration: number }

const progressOf = (g: Glide, now: number): number =>
    g.duration > 0 ? Math.min(1, (now - g.startedAt) / g.duration) : 1;

// Cubic Hermite with m1 = 0: p(t) = h00·p0 + h10·m0 + h01·p1. At m0 = 3(p1−p0)
// it is exactly ease-out-cubic, so a segment started from rest is unchanged.
const sample = (g: Glide, t: number, i: number): number =>
    (2 * t ** 3 - 3 * t ** 2 + 1) * g.from[i]
    + (t ** 3 - 2 * t ** 2 + t) * g.m0[i]
    + (-2 * t ** 3 + 3 * t ** 2) * g.to[i];

/** dp/dtime, so a retarget can hand the live velocity to the next segment's m0. */
const slope = (g: Glide, t: number, i: number): number => (g.duration > 0
    ? ((6 * t ** 2 - 6 * t) * g.from[i]
        + (3 * t ** 2 - 4 * t + 1) * g.m0[i]
        + (-6 * t ** 2 + 6 * t) * g.to[i]) / g.duration
    : 0);

const positionAt = (g: Glide, now: number): Triple => {
    const t = progressOf(g, now);
    return [sample(g, t, 0), sample(g, t, 1), sample(g, t, 2)];
};

/** Wrap a tracker so reported jumps ease in: moves over 24px glide over 120ms, both tunable. */
export function withKeyboardGlide(
    tracker: KeyboardTracker,
    opts: KeyboardGlideOptions = {},
): KeyboardTracker {
    if (!opts.glide || typeof window === 'undefined') return tracker;

    const threshold = opts.glideThresholdPx ?? 24;
    const duration = opts.glideDurationMs ?? 120;
    const listeners = new Set<(s: KeyboardState) => void>();
    let unsubscribeRaw: (() => void) | null = null;
    let raw: KeyboardState = tracker.getState();
    let published: KeyboardState = raw;
    let glide: Glide | null = null;
    let rafId: number | null = null;
    let cacheWidth = window.innerWidth;
    let cacheHeight = window.innerHeight;
    let unmeasured = raw.visualHeight === 0;

    const publish = (inset: number, visual: number, layout: number): void => {
        const p = published;
        const n: KeyboardState = {
            ...raw,
            insetPx: Math.round(inset),
            visualHeight: Math.round(visual),
            layoutHeight: Math.round(layout),
        };
        if (p.visible === n.visible && p.insetPx === n.insetPx && p.mode === n.mode
            && p.visualHeight === n.visualHeight && p.layoutHeight === n.layoutHeight
            && p.editableFocused === n.editableFocused
            && p.source === n.source) return;
        published = Object.freeze(n);
        for (const cb of listeners) cb(published);
    };

    const stop = (): void => {
        glide = null;
        if (rafId !== null) cancelAnimationFrame(rafId);
        rafId = null;
    };

    const snap = (s: KeyboardState): void => {
        stop();
        publish(s.insetPx, s.visualHeight, s.layoutHeight);
    };

    const tick = (): void => {
        rafId = null;
        if (!glide) return;
        const now = performance.now();
        const done = now >= glide.startedAt + glide.duration;
        const [inset, visual, layout] = positionAt(glide, now);
        if (done) stop();
        publish(inset, visual, layout);
        if (!done) rafId = requestAnimationFrame(tick);
    };

    const onRaw = (next: KeyboardState): void => {
        raw = next;
        // The seed (visualHeight 0) is not a position anything was ever painted at.
        if (unmeasured) { unmeasured = false; snap(next); return; }
        // Rotation: not one scale to glide across.
        if (window.innerWidth !== cacheWidth) {
            [cacheWidth, cacheHeight] = [window.innerWidth, window.innerHeight];
            snap(next);
            return;
        }
        const now = performance.now();
        const current = glide;
        const at: Triple = current
            ? positionAt(current, now)
            : [published.insetPx, published.visualHeight, published.layoutHeight];
        const to: Triple = [next.insetPx, next.visualHeight, next.layoutHeight];
        // A host that resized the layout viewport already moved inset/visual with it —
        // only the column is left to ease across the step.
        const stepped = window.innerHeight !== cacheHeight;
        cacheHeight = window.innerHeight;
        const from: Triple = stepped ? [to[0], to[1], at[2]] : [at[0], at[1], at[2]];
        const jumped = to.some((v, i) => Math.abs(v - from[i]) > threshold);
        if (!glide && !jumped) { snap(next); return; }
        // Retarget carries the live velocity into the fresh segment, so a step stream
        // renders as one curve instead of a saw-tooth of restarted ease-outs.
        const t = current ? progressOf(current, now) : 0;
        // A carried velocity above the ease-out's own start slope (3Δ) would overshoot the target.
        const tangent = (i: number, snapped: boolean): number => {
            const cap = 3 * Math.abs(to[i] - from[i]);
            if (snapped) return 0;
            if (!current) return 3 * (to[i] - from[i]);
            return Math.max(-cap, Math.min(cap, slope(current, t, i) * duration));
        };
        const m0: Triple = [tangent(0, stepped), tangent(1, stepped), tangent(2, false)];
        glide = { from, m0, to, startedAt: now, duration };
        if (rafId === null) rafId = requestAnimationFrame(tick);
        // The fields that are not interpolated belong to the report, not to the next frame.
        publish(from[0], from[1], from[2]);
    };

    return {
        // Before the first subscriber there is no clock to lag behind, and the seed is stale.
        getState: () => (unsubscribeRaw ? published : tracker.getState()),
        subscribe(cb) {
            listeners.add(cb);
            if (!unsubscribeRaw) {
                raw = tracker.getState();
                published = raw;
                unmeasured = raw.visualHeight === 0;
                cacheWidth = window.innerWidth;
                cacheHeight = window.innerHeight;
                unsubscribeRaw = tracker.subscribe(onRaw);
            }
            return () => {
                listeners.delete(cb);
                if (listeners.size === 0) { unsubscribeRaw?.(); unsubscribeRaw = null; stop(); }
            };
        },
        setOverride: (px) => tracker.setOverride(px),
        destroy: () => {
            stop();
            listeners.clear();
            unsubscribeRaw?.();
            unsubscribeRaw = null;
            tracker.destroy();
        },
    };
}

const SHARED_GLIDE_KEY = Symbol.for('@sparcs-kaist/keyboard-inset:shared-glide');

/** One shared glide per glide options — pass the SAME options everywhere, or clocks diverge. */
export function getSharedKeyboardGlide(opts: KeyboardGlideOptions = {}): KeyboardTracker {
    if (typeof window === 'undefined' || !opts.glide) return getSharedKeyboardTracker();
    const g = globalThis as Record<PropertyKey, unknown>;
    const cache = (g[SHARED_GLIDE_KEY] ??= new Map()) as Map<string, KeyboardTracker>;
    const key = JSON.stringify([opts.glideThresholdPx ?? null, opts.glideDurationMs ?? null]);
    const cached = cache.get(key);
    if (cached) return cached;

    const wrapped = withKeyboardGlide(getSharedKeyboardTracker(), opts);
    const instance: KeyboardTracker = {
        getState: () => wrapped.getState(),
        subscribe: (cb) => wrapped.subscribe(cb),
        setOverride: (px) => wrapped.setOverride(px),
        destroy: () => { wrapped.destroy(); cache.delete(key); },
    };
    cache.set(key, instance);
    return instance;
}
