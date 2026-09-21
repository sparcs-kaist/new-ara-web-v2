// Reports land in one late jump, so consumers snap: ease insetPx / visualHeight toward them.

import { getSharedKeyboardTracker, type KeyboardState, type KeyboardTracker } from './tracker';

export interface KeyboardGlideOptions {
    glide?: boolean;
    glideThresholdPx?: number;
    glideDurationMs?: number;
}

interface Glide { from: [number, number]; to: [number, number]; startedAt: number; endsAt: number }

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

    const publish = (inset: number, visual: number): void => {
        const p = published;
        const n: KeyboardState = { ...raw, insetPx: Math.round(inset), visualHeight: Math.round(visual) };
        if (p.visible === n.visible && p.insetPx === n.insetPx && p.mode === n.mode
            && p.visualHeight === n.visualHeight && p.editableFocused === n.editableFocused
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
        publish(s.insetPx, s.visualHeight);
    };

    const positionAt = (g: Glide, now: number): [number, number] => {
        const span = g.endsAt - g.startedAt;
        const t = span > 0 ? Math.min(1, (now - g.startedAt) / span) : 1;
        const p = 1 - (1 - t) ** 3;
        return [g.from[0] + (g.to[0] - g.from[0]) * p, g.from[1] + (g.to[1] - g.from[1]) * p];
    };

    const tick = (): void => {
        rafId = null;
        if (!glide) return;
        const now = performance.now();
        const done = now >= glide.endsAt;
        const [inset, visual] = positionAt(glide, now);
        if (done) stop();
        publish(inset, visual);
        if (!done) rafId = requestAnimationFrame(tick);
    };

    const onRaw = (next: KeyboardState): void => {
        raw = next;
        // The seed (visualHeight 0) is not a position anything was ever painted at.
        if (unmeasured) { unmeasured = false; snap(next); return; }
        // Rotation, or a host resizing the layout viewport: not one scale to glide across.
        if (window.innerWidth !== cacheWidth || window.innerHeight !== cacheHeight) {
            [cacheWidth, cacheHeight] = [window.innerWidth, window.innerHeight];
            snap(next);
            return;
        }
        const jumped = Math.abs(next.insetPx - published.insetPx) > threshold
            || Math.abs(next.visualHeight - published.visualHeight) > threshold;
        if (!glide && !jumped) { snap(next); return; }
        const now = performance.now();
        const current = glide;
        const from: [number, number] = current
            ? positionAt(current, now) : [published.insetPx, published.visualHeight];
        // Absolute deadline, kept when the target barely moved: a per-frame report stream must not reset t.
        const endsAt = current
            && Math.abs(next.insetPx - current.to[0]) <= threshold
            && Math.abs(next.visualHeight - current.to[1]) <= threshold
            ? Math.max(current.endsAt, now + 16)
            : now + duration;
        glide = { from, to: [next.insetPx, next.visualHeight], startedAt: now, endsAt };
        if (rafId === null) rafId = requestAnimationFrame(tick);
        // The fields that are not interpolated belong to the report, not to the next frame.
        publish(from[0], from[1]);
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
