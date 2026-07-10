import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
    cubicBezierY,
    withKeyboardMotion,
    type KeyboardMotionOptions,
} from '../src/motion';
import {
    type KeyboardState,
    type KeyboardTracker,
    type KeyboardViewportMode,
} from '../src/tracker';

/**
 * Harness for the 'animated' keyboard-motion decorator.
 *
 * Three things are faked and driven by hand:
 *   - a FakeTracker (no DOM) whose published state we push manually,
 *   - the rAF loop (a Map keyed by id so cancelAnimationFrame really cancels),
 *   - the clock: performance.now() reads a mutable `nowMs`, and the 90ms
 *     settle setTimeout runs on vitest fake timers advanced in lockstep.
 *
 * `advance(ms)` moves the clock and the fake-timer clock together in small
 * steps, flushing a rAF frame after each step — so the master rAF loop and
 * the settle timer observe a consistent time.
 */

class FakeTracker implements KeyboardTracker {
    private readonly listeners = new Set<(s: KeyboardState) => void>();
    private state: KeyboardState;

    constructor(initial: KeyboardState) {
        this.state = Object.freeze(initial);
    }

    getState(): KeyboardState {
        return this.state;
    }

    subscribe(cb: (s: KeyboardState) => void): () => void {
        this.listeners.add(cb);
        return () => {
            this.listeners.delete(cb);
        };
    }

    setOverride(): void {}

    destroy(): void {
        this.listeners.clear();
    }

    /** Test helper: publish a new raw state to every subscriber. */
    publish(next: KeyboardState): void {
        this.state = Object.freeze(next);
        for (const cb of this.listeners) cb(this.state);
    }
}

const closed = (visualHeight = 800): KeyboardState => ({
    visible: false,
    insetPx: 0,
    mode: 'overlay' as KeyboardViewportMode,
    visualHeight,
    editableFocused: false,
    source: 'geometry',
});

const open = (insetPx: number, visualHeight: number): KeyboardState => ({
    visible: true,
    insetPx,
    mode: 'overlay' as KeyboardViewportMode,
    visualHeight,
    editableFocused: true,
    source: 'geometry',
});

// ---- fake rAF queue + clock -------------------------------------------------

let rafMap: Map<number, FrameRequestCallback>;
let rafCounter: number;
let nowMs: number;

function flushRaf(): void {
    const entries = [...rafMap.values()];
    rafMap = new Map();
    for (const cb of entries) cb(nowMs);
}

/** Advance clock + fake timers together, flushing one frame per step. */
function advance(ms: number, step = 16): void {
    let elapsed = 0;
    while (elapsed < ms) {
        const d = Math.min(step, ms - elapsed);
        nowMs += d;
        vi.advanceTimersByTime(d);
        flushRaf();
        elapsed += d;
    }
}

let trackers: KeyboardTracker[];
function track<T extends KeyboardTracker>(t: T): T {
    trackers.push(t);
    return t;
}

// Short duration (80ms) keeps every animation finishing before the 90ms
// settle timer, so learn/confirm/correct is deterministic.
const DEFAULT_OPTS: KeyboardMotionOptions = { motion: 'animated', host: 'flutter', duration: 80 };

function setup(opts: KeyboardMotionOptions = DEFAULT_OPTS): {
    fake: FakeTracker;
    m: KeyboardTracker;
    states: KeyboardState[];
    unsub: () => void;
} {
    const fake = new FakeTracker(closed(800));
    const m = track(withKeyboardMotion(fake, opts));
    const states: KeyboardState[] = [];
    const unsub = m.subscribe((s) => states.push(s));
    fake.publish(closed(800)); // prime: learn fullVisual = 800
    return { fake, m, states, unsub };
}

const last = (states: KeyboardState[]): KeyboardState => states[states.length - 1];

beforeEach(() => {
    (window as unknown as { innerWidth: number }).innerWidth = 390;
    (window as unknown as { innerHeight: number }).innerHeight = 800;
    rafMap = new Map();
    rafCounter = 0;
    nowMs = 0;
    trackers = [];
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
        const id = ++rafCounter;
        rafMap.set(id, cb);
        return id;
    });
    vi.stubGlobal('cancelAnimationFrame', (id: number) => {
        rafMap.delete(id);
    });
    vi.spyOn(performance, 'now').mockImplementation(() => nowMs);
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
});

afterEach(() => {
    for (const t of trackers) t.destroy();
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
});

describe('withKeyboardMotion — mode selection', () => {
    it('returns the same tracker instance for the tracked (default) motion', () => {
        const fake = track(new FakeTracker(closed()));
        expect(withKeyboardMotion(fake, { motion: 'tracked' })).toBe(fake);
        expect(withKeyboardMotion(fake)).toBe(fake); // default is 'tracked'
        expect(withKeyboardMotion(fake, { motion: 'tracked', host: 'flutter' })).toBe(fake);
    });
});

describe('cubicBezierY', () => {
    it('maps endpoints exactly and clamps out-of-range x', () => {
        expect(cubicBezierY(0.2, 0, 0, 1, 0)).toBe(0);
        expect(cubicBezierY(0.2, 0, 0, 1, 1)).toBe(1);
        expect(cubicBezierY(0.2, 0, 0, 1, -5)).toBe(0);
        expect(cubicBezierY(0.2, 0, 0, 1, 5)).toBe(1);
    });

    it('is monotonic non-decreasing and in [0,1] across [0,1] for the AOSP synced curve', () => {
        let prev = -Infinity;
        for (let i = 0; i <= 200; i++) {
            const x = i / 200;
            const y = cubicBezierY(0.2, 0, 0, 1, x);
            expect(y).toBeGreaterThanOrEqual(prev - 1e-9);
            expect(y).toBeGreaterThanOrEqual(-1e-9);
            expect(y).toBeLessThanOrEqual(1 + 1e-9);
            prev = y;
        }
    });

    it('reduces to y = x for the linear curve (0,0,1,1)', () => {
        for (const x of [0.05, 0.1, 0.25, 0.5, 0.75, 0.9, 0.99]) {
            expect(cubicBezierY(0, 0, 1, 1, x)).toBeCloseTo(x, 4);
        }
    });
});

describe('withKeyboardMotion — animated', () => {
    it('passes the first-ever presentation through, then animates a later small-first open toward the learned target', () => {
        const { fake, states } = setup();

        // First presentation is a browser-style jump; it animates and, once
        // reports go quiet, its end position (300) is learned.
        fake.publish(open(300, 500));
        advance(200); // completes (~80ms) and settles (90ms)
        expect(last(states).insetPx).toBe(300);
        expect(last(states).visualHeight).toBe(500);

        // Back to rest.
        fake.publish(closed(800));
        advance(200);
        expect(last(states).insetPx).toBe(0);
        expect(last(states).visualHeight).toBe(800);

        // A later open whose FIRST report is tiny (15px) must not crawl — it
        // animates toward the learned 300 on the curve. Sample strictly
        // before the 90ms settle (raw stays stale at 15 with no follow-ups).
        fake.publish(open(15, 790));
        advance(30);
        const mid1 = last(states).insetPx;
        advance(30); // total 60ms < 90ms settle
        const mid2 = last(states).insetPx;
        expect(mid1).toBeGreaterThan(15);
        expect(mid1).toBeLessThan(300);
        expect(mid2).toBeGreaterThan(mid1); // following the curve toward 300
        expect(mid2).toBeLessThan(300);
    });

    it('animates a browser-style one-jump open (0 -> 300) immediately, even with no cache', () => {
        const { fake, states } = setup();

        fake.publish(open(300, 500)); // one report IS the whole keyboard
        advance(24); // mid-flight, not snapped
        const early = last(states).insetPx;
        expect(early).toBeGreaterThan(0);
        expect(early).toBeLessThan(300);

        advance(32); // ~56ms, still < 80ms duration
        const mid = last(states).insetPx;
        expect(mid).toBeGreaterThan(early);
        expect(mid).toBeLessThan(300);

        advance(200); // complete + settle
        expect(last(states).insetPx).toBe(300);
        expect(last(states).visualHeight).toBe(500);
        expect(last(states).visible).toBe(true);
    });

    it('absorbs mid-flight reports without snapping the published value', () => {
        const { fake, states } = setup();

        fake.publish(open(300, 500)); // start animation toward 300
        advance(32); // mid-flight (< 80ms duration, < 90ms settle)
        const onCurve = last(states).insetPx;
        expect(onCurve).toBeGreaterThan(0);
        expect(onCurve).toBeLessThan(300);

        const count = states.length;
        // Intermediate raw reports (the same motion we are already playing).
        fake.publish(open(40, 470));
        fake.publish(open(80, 460));
        fake.publish(open(120, 450));
        expect(last(states).insetPx).toBe(onCurve); // unchanged by the reports
        expect(states.length).toBe(count); // no publish happened at all
    });

    it('corrects to the real end position after the quiet period and updates the cache', () => {
        const { fake, states } = setup();

        // Learn openInset = 300.
        fake.publish(open(300, 500));
        advance(200);
        fake.publish(closed(800));
        advance(200);
        expect(last(states).insetPx).toBe(0);

        // Open: cache predicts 300, but the keyboard actually settles at 336.
        fake.publish(open(15, 790)); // small first report -> targets cached 300
        fake.publish(open(336, 470)); // climbing report; absorbed while animating
        advance(200); // completes to 300, then settle (90ms) corrects to 336
        expect(last(states).insetPx).toBe(336);
        expect(last(states).visualHeight).toBe(470);

        // Cache now holds 336: the next small-first open animates toward 336.
        fake.publish(closed(800));
        advance(200);
        fake.publish(open(15, 790));
        advance(85); // past the 80ms animation, before the 90ms settle
        expect(last(states).insetPx).toBe(336);
        expect(last(states).visualHeight).toBe(470);
    });

    it('close ratchets to inset 0 and full height, ignoring a stale shrunk visualHeight in the close report', () => {
        const { fake, states } = setup();

        fake.publish(open(300, 500));
        advance(200);
        expect(last(states).visualHeight).toBe(500);

        // The close report still carries the shrunk 500 (report lag). The
        // hide must ratchet the visual height back to the learned full 800.
        fake.publish(closed(500));
        advance(16);
        expect(last(states).insetPx).toBeLessThan(300); // animating down
        advance(200);
        expect(last(states).insetPx).toBe(0);
        expect(last(states).visualHeight).toBe(800); // ratcheted, not stale 500
        expect(last(states).visible).toBe(false);
    });

    it('snaps small deltas (<=24px) without animating (accessory bars, text growth)', () => {
        const { fake, states } = setup();

        fake.publish(open(20, 780)); // 20px, no keyboard jump, no cache
        // Published synchronously, with no frame scheduled.
        expect(last(states).insetPx).toBe(20);
        expect(last(states).visualHeight).toBe(780);
        expect(rafMap.size).toBe(0); // no animation running
    });

    it('drops the cache and passes through on rotation (innerWidth change)', () => {
        const { fake, states } = setup();

        // Establish cache at portrait width 390.
        fake.publish(open(300, 500));
        advance(200);
        expect(last(states).insetPx).toBe(300);

        // Rotate to landscape: the next report passes straight through.
        (window as unknown as { innerWidth: number }).innerWidth = 800;
        fake.publish(open(250, 400));
        expect(last(states).insetPx).toBe(250); // passthrough, not animated
        expect(last(states).visualHeight).toBe(400);
        expect(rafMap.size).toBe(0); // animation dropped

        // Cache cleared: a later small-first open no longer animates toward 300.
        fake.publish(closed(400));
        advance(200);
        fake.publish(open(18, 392));
        expect(last(states).insetPx).toBe(18); // no cache -> passthrough
        expect(rafMap.size).toBe(0);
    });

    it('unsubscribe stops the rAF loop and the settle timer (no further publishes)', () => {
        const { fake, states, unsub } = setup();

        fake.publish(open(300, 500)); // start animation + arm settle
        advance(30); // mid-flight
        expect(rafMap.size).toBeGreaterThan(0); // a frame is queued
        const n = states.length;

        unsub(); // last listener gone -> tear down raw sub, anim, settle

        // Nothing may publish again: advance well past duration/settle and
        // push more raw reports.
        advance(300);
        fake.publish(open(400, 300));
        fake.publish(closed(800));
        advance(300);
        expect(states.length).toBe(n);
    });

    it('extends the target mid-flight when reports pass the cached prediction (taller keyboard)', () => {
        const { fake, m } = setup();

        // Learn a 300px keyboard, then close.
        fake.publish(open(300, 500));
        advance(200); // finish + settle -> cache 300
        fake.publish(closed(800));
        advance(200);

        // A taller keyboard opens: small first report animates toward the
        // cached 300, then the stream climbs past it.
        fake.publish(open(15, 800));
        advance(32); // mid-flight
        fake.publish(open(340, 800));
        fake.publish(open(380, 800));
        advance(80); // animation completes — well before the 90ms settle

        // The animation must have carried the published value to the real
        // height without waiting for the settle correction.
        expect(m.getState().insetPx).toBe(380);
    });
});
