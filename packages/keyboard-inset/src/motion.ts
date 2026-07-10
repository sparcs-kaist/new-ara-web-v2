/**
 * Keyboard motion for published inset/visualHeight values.
 *
 *   'tracked'  — pass reported values through as-is (correct, but trails the
 *                keyboard by the report pipeline's latency).
 *   'animated' — play the platform keyboard curve locally; reported values
 *                only confirm/correct the end position once reports settle.
 *
 * 'animated' passes the first-ever presentation through untouched to learn
 * the keyboard height. Consumers fed the SAME wrapped tracker share one
 * clock, so the bar and the scroll fold cannot drift apart.
 */

import { getSharedKeyboardTracker, type KeyboardState, type KeyboardTracker } from './tracker';

/** Which app framework hosts the WebView (decides the animation preset). */
export type KeyboardHost =
    | 'flutter'
    | 'react-native'
    | 'react-native-synced'
    | 'android'
    | 'ios'
    | 'browser';

export type KeyboardMotion = 'tracked' | 'animated';

export interface KeyboardMotionOptions {
    /** Default `'tracked'` (today's behavior). */
    motion?: KeyboardMotion;
    /** Picks the platform curve preset. Default `'browser'`. */
    host?: KeyboardHost;
    /** Override the preset duration (ms). */
    duration?: number;
    /** Override the preset curve — cubic-bezier control points. */
    easing?: readonly [number, number, number, number];
}

interface CurvePreset {
    duration: number;
    show: readonly [number, number, number, number];
    hide: readonly [number, number, number, number];
}

// AOSP InsetsController constants. "synced" = the host window registered a
// WindowInsetsAnimation callback (285ms, one curve both ways); "unsynced"
// windows get 200ms with direction-specific curves.
const SYNCED: CurvePreset = { duration: 285, show: [0.2, 0, 0, 1], hide: [0.2, 0, 0, 1] };
const UNSYNCED: CurvePreset = { duration: 200, show: [0, 0, 0.2, 1], hide: [0.4, 0, 1, 1] };

const PRESETS: Record<KeyboardHost, CurvePreset> = {
    flutter: SYNCED, // engine registers ImeSyncDeferringInsetsCallback (1.22+, Android 11+)
    'react-native': UNSYNCED, // RN core registers no insets-animation callback
    'react-native-synced': SYNCED, // keyboard-controller / Reanimated useAnimatedKeyboard
    android: UNSYNCED, // plain WebView app, no callback anywhere in the window
    // iOS uses a private spring with per-event parameters — no correct static
    // preset. Pass duration/easing from the bridge, or use 'tracked'.
    ios: SYNCED,
    browser: SYNCED, // best effort: browsers resize in one jump, curve unknowable
};

/** Changes at or below this snap instantly (accessory bars, text growth). */
const SNAP_THRESHOLD_PX = 24;
/** A single report moving at least this much is a keyboard; its value IS
 *  the end position (browser-style one-jump resize). */
const JUMP_THRESHOLD_PX = 50;
/** End-position corrections at or below this are absorbed silently. */
const CORRECTION_EPSILON_PX = 2;
/** Reports quiet for this long count as settled (streams report per frame). */
const SETTLE_QUIET_MS = 90;

/**
 * y of cubic-bezier(x1,y1,x2,y2) at horizontal position x ∈ [0,1] — the
 * same mapping CSS easing uses.
 */
export function cubicBezierY(
    x1: number, y1: number, x2: number, y2: number, x: number,
): number {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    const cx = 3 * x1;
    const bx = 3 * (x2 - x1) - cx;
    const ax = 1 - cx - bx;
    const cy = 3 * y1;
    const by = 3 * (y2 - y1) - cy;
    const ay = 1 - cy - by;
    const sampleX = (t: number) => ((ax * t + bx) * t + cx) * t;
    const sampleDX = (t: number) => (3 * ax * t + 2 * bx) * t + cx;

    let t = x;
    for (let i = 0; i < 8; i++) {
        const err = sampleX(t) - x;
        if (Math.abs(err) < 1e-5) break;
        const d = sampleDX(t);
        if (Math.abs(d) < 1e-6) break;
        t -= err / d;
    }
    if (t < 0 || t > 1 || Math.abs(sampleX(t) - x) >= 1e-4) {
        let lo = 0;
        let hi = 1;
        t = x;
        for (let i = 0; i < 24; i++) {
            if (sampleX(t) < x) lo = t; else hi = t;
            t = (lo + hi) / 2;
        }
    }
    return ((ay * t + by) * t + cy) * t;
}

interface Animation {
    fromInset: number;
    toInset: number;
    fromVisual: number;
    toVisual: number;
    startedAt: number;
    duration: number;
    curve: readonly [number, number, number, number];
}

/**
 * Wrap a tracker so its published `insetPx` / `visualHeight` move on the
 * platform keyboard curve (see module doc). `'tracked'` returns the input
 * unchanged.
 */
export function withKeyboardMotion(
    tracker: KeyboardTracker,
    opts: KeyboardMotionOptions = {},
): KeyboardTracker {
    const motion = opts.motion ?? 'tracked';
    if (motion === 'tracked' || typeof window === 'undefined') return tracker;

    const preset = PRESETS[opts.host ?? 'browser'];
    const duration = opts.duration ?? preset.duration;
    const showCurve = opts.easing ?? preset.show;
    const hideCurve = opts.easing ?? preset.hide;

    const listeners = new Set<(s: KeyboardState) => void>();
    let unsubscribeRaw: (() => void) | null = null;
    let raw: KeyboardState = tracker.getState();
    let published: KeyboardState = raw;
    let anim: Animation | null = null;
    let rafId: number | null = null;
    let settleTimer: number | undefined;
    // Last settled keyboard-open geometry — predicts the NEXT opening's end
    // position. Stays 0 until one real presentation settles.
    let openInset = 0;
    let openVisual = 0;
    // Largest visual height seen at this width = the keyboard-closed
    // height, i.e. the end position of every close.
    let fullVisual = 0;
    let cacheWidth = window.innerWidth;

    const publish = (next: KeyboardState) => {
        const prev = published;
        if (
            prev.visible === next.visible
            && prev.insetPx === next.insetPx
            && prev.mode === next.mode
            && prev.visualHeight === next.visualHeight
            && prev.editableFocused === next.editableFocused
            && prev.source === next.source
        ) return;
        published = Object.freeze(next);
        for (const cb of listeners) cb(published);
    };

    /** Passthrough of everything except the two animated fields. */
    const compose = (insetPx: number, visualHeight: number): KeyboardState => ({
        ...raw,
        insetPx: Math.round(insetPx),
        visualHeight: Math.round(visualHeight),
    });

    const stopAnim = () => {
        anim = null;
        if (rafId !== null) {
            cancelAnimationFrame(rafId);
            rafId = null;
        }
    };

    const clearSettle = () => {
        if (settleTimer !== undefined) {
            window.clearTimeout(settleTimer);
            settleTimer = undefined;
        }
    };

    const tick = () => {
        rafId = null;
        if (!anim) return;
        const t = Math.min(1, (performance.now() - anim.startedAt) / anim.duration);
        const p = cubicBezierY(anim.curve[0], anim.curve[1], anim.curve[2], anim.curve[3], t);
        publish(compose(
            anim.fromInset + (anim.toInset - anim.fromInset) * p,
            anim.fromVisual + (anim.toVisual - anim.fromVisual) * p,
        ));
        if (t >= 1) {
            stopAnim();
            return;
        }
        rafId = requestAnimationFrame(tick);
    };

    const startAnim = (
        toInset: number, toVisual: number, curve: readonly [number, number, number, number],
    ) => {
        stopAnim();
        anim = {
            fromInset: published.insetPx,
            toInset,
            fromVisual: published.visualHeight,
            toVisual,
            startedAt: performance.now(),
            duration,
            curve,
        };
        rafId = requestAnimationFrame(tick);
    };

    // Reports go quiet -> the keyboard reached its end position. Learn it
    // and correct any prediction error.
    const onSettled = () => {
        settleTimer = undefined;
        if (!raw.visible || raw.insetPx === 0 && fullVisual - raw.visualHeight < JUMP_THRESHOLD_PX) return;
        openInset = raw.insetPx;
        openVisual = raw.visualHeight;
        const endInset = anim ? anim.toInset : published.insetPx;
        const endVisual = anim ? anim.toVisual : published.visualHeight;
        if (
            Math.abs(endInset - raw.insetPx) > CORRECTION_EPSILON_PX
            || Math.abs(endVisual - raw.visualHeight) > CORRECTION_EPSILON_PX
        ) {
            // Prediction missed (OEM fork, split keyboard, one-off IME):
            // glide the remainder instead of snapping.
            startAnim(raw.insetPx, raw.visualHeight, showCurve);
        } else if (anim) {
            // Confirming report — pin the exact end position.
            anim.toInset = raw.insetPx;
            anim.toVisual = raw.visualHeight;
        }
    };

    const armSettle = () => {
        clearSettle();
        settleTimer = window.setTimeout(onSettled, SETTLE_QUIET_MS);
    };

    const onRaw = (next: KeyboardState) => {
        const prev = raw;
        raw = next;
        fullVisual = Math.max(fullVisual, next.visualHeight);

        if (window.innerWidth !== cacheWidth) {
            // Rotation: every cached geometry is for the wrong orientation.
            cacheWidth = window.innerWidth;
            openInset = 0;
            openVisual = 0;
            fullVisual = next.visualHeight;
            stopAnim();
            clearSettle();
            publish(compose(next.insetPx, next.visualHeight));
            return;
        }

        const opening = !prev.visible && next.visible;
        const closing = prev.visible && !next.visible;

        if (closing) {
            clearSettle();
            const toVisual = fullVisual || next.visualHeight;
            if (
                published.insetPx > SNAP_THRESHOLD_PX
                || toVisual - published.visualHeight > SNAP_THRESHOLD_PX
            ) {
                startAnim(0, toVisual, hideCurve);
            } else {
                stopAnim();
                publish(compose(next.insetPx, next.visualHeight));
            }
            return;
        }

        if (opening) {
            const insetJump = next.insetPx - published.insetPx;
            const visualJump = published.visualHeight - next.visualHeight;
            const jumped = insetJump >= JUMP_THRESHOLD_PX || visualJump >= JUMP_THRESHOLD_PX;
            // An explicit one-jump report is authoritative; otherwise use
            // the last settled presentation.
            const toInset = jumped ? next.insetPx : (openInset > 0 ? openInset : next.insetPx);
            const toVisual = jumped ? next.visualHeight : (openVisual > 0 ? openVisual : next.visualHeight);
            const knowsTarget = jumped || openInset > 0 || openVisual > 0;
            if (knowsTarget && (
                toInset - published.insetPx > SNAP_THRESHOLD_PX
                || published.visualHeight - toVisual > SNAP_THRESHOLD_PX
            )) {
                startAnim(toInset, toVisual, showCurve);
            } else {
                // First-ever presentation: pass through and learn.
                stopAnim();
                publish(compose(next.insetPx, next.visualHeight));
            }
            armSettle();
            return;
        }

        if (next.visible) {
            // Mid-presentation reports: absorb while animating, else follow.
            // Extend the target so the animation never finishes short.
            armSettle();
            if (anim) {
                if (next.insetPx > anim.toInset) anim.toInset = next.insetPx;
                if (next.visualHeight < anim.toVisual) anim.toVisual = next.visualHeight;
            } else {
                publish(compose(next.insetPx, next.visualHeight));
            }
            return;
        }

        // Not visible, no transition (focus flips, chrome noise): pass
        // through unless a close animation is still finishing.
        if (!anim) publish(compose(next.insetPx, next.visualHeight));
    };

    return {
        getState: () => published,
        subscribe(cb) {
            listeners.add(cb);
            if (!unsubscribeRaw) {
                raw = tracker.getState();
                published = raw;
                unsubscribeRaw = tracker.subscribe(onRaw);
            }
            return () => {
                listeners.delete(cb);
                if (listeners.size === 0 && unsubscribeRaw) {
                    unsubscribeRaw();
                    unsubscribeRaw = null;
                    stopAnim();
                    clearSettle();
                }
            };
        },
        setOverride: (px) => tracker.setOverride(px),
        destroy: () => {
            stopAnim();
            clearSettle();
            listeners.clear();
            if (unsubscribeRaw) {
                unsubscribeRaw();
                unsubscribeRaw = null;
            }
            tracker.destroy();
        },
    };
}

// Shared instances live on globalThis so HMR module duplication in dev
// cannot end up with two animation clocks over the same tracker.
const SHARED_MOTION_KEY = Symbol.for('@sparcs-kaist/keyboard-inset:shared-motion');

/**
 * Shared motion-wrapped tracker over the shared tracker, cached per
 * options. Give the SAME options everywhere in the app — every consumer
 * must share one clock, or bars and scroll positions animate separately.
 */
export function getSharedKeyboardMotion(opts: KeyboardMotionOptions = {}): KeyboardTracker {
    if (typeof window === 'undefined' || (opts.motion ?? 'tracked') === 'tracked') {
        return getSharedKeyboardTracker();
    }
    const g = globalThis as Record<PropertyKey, unknown>;
    let cache = g[SHARED_MOTION_KEY] as Map<string, KeyboardTracker> | undefined;
    if (!cache) {
        cache = new Map();
        g[SHARED_MOTION_KEY] = cache;
    }
    const key = JSON.stringify([opts.motion, opts.host, opts.duration, opts.easing]);
    let instance = cache.get(key);
    if (!instance) {
        instance = withKeyboardMotion(getSharedKeyboardTracker(), opts);
        cache.set(key, instance);
    }
    return instance;
}
