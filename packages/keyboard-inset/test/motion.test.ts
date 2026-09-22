import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getSharedKeyboardGlide, withKeyboardGlide } from '../src/motion';
import {
    getSharedKeyboardTracker, INITIAL_KEYBOARD_STATE, type KeyboardState, type KeyboardTracker,
} from '../src/tracker';

class FakeTracker implements KeyboardTracker {
    state: KeyboardState = INITIAL_KEYBOARD_STATE;
    readonly listeners = new Set<(s: KeyboardState) => void>();
    readonly overrides: (number | null)[] = [];
    destroyed = false;

    getState(): KeyboardState { return this.state; }
    subscribe(cb: (s: KeyboardState) => void): () => void {
        this.listeners.add(cb); return () => { this.listeners.delete(cb); };
    }
    setOverride(px: number | null): void { this.overrides.push(px); }
    destroy(): void { this.destroyed = true; }
    emit(patch: Partial<KeyboardState>): void {
        this.state = Object.freeze({ ...this.state, ...patch });
        for (const cb of [...this.listeners]) cb(this.state);
    }
}

let clock: number; let rafSeq: number; let cancelled: number[];
let rafQueue: Map<number, FrameRequestCallback>;

/** The wrapper reads `performance.now()` inside frames, so both move together. */
function frame(ms: number): void {
    clock += ms;
    const due = [...rafQueue.values()];
    rafQueue.clear();
    for (const cb of due) cb(clock);
}

function insetPath(t: KeyboardTracker, n: number, ms: number): number[] {
    const out: number[] = [];
    for (let i = 0; i < n; i++) { frame(ms); out.push(t.getState().insetPx); }
    return out;
}
const geo = (t: KeyboardTracker): number[] => [t.getState().insetPx, t.getState().visualHeight];
function resize(innerWidth: number, innerHeight: number): void {
    Object.assign(window, { innerWidth, innerHeight });
}

/** Wrapped tracker with the keyboard-closed baseline already reported. */
function make(): { raw: FakeTracker; glided: KeyboardTracker; seen: KeyboardState[] } {
    const raw = new FakeTracker();
    const glided = withKeyboardGlide(raw, { glide: true });
    const seen: KeyboardState[] = [];
    glided.subscribe((s) => seen.push(s));
    raw.emit({ visualHeight: 800, layoutHeight: 800 });
    seen.length = 0;
    return { raw, glided, seen };
}

beforeEach(() => {
    clock = 1000; rafSeq = 0;
    rafQueue = new Map(); cancelled = [];
    resize(390, 800);
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
        rafQueue.set(++rafSeq, cb); return rafSeq;
    });
    vi.stubGlobal('cancelAnimationFrame', (id: number) => {
        cancelled.push(id); rafQueue.delete(id);
    });
    vi.spyOn(performance, 'now').mockImplementation(() => clock);
});

afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
});

describe('withKeyboardGlide', () => {
    it('returns the raw tracker when glide is off', () => {
        const raw = new FakeTracker();
        expect(withKeyboardGlide(raw)).toBe(raw);
        expect(withKeyboardGlide(raw, {})).toBe(raw);
        expect(withKeyboardGlide(raw, { glide: false })).toBe(raw);
    });

    it('snaps the first measurement and publishes sub-threshold changes immediately', () => {
        const { raw, glided } = make();
        expect(glided.getState().visualHeight).toBe(800);
        expect(rafQueue.size).toBe(0);
        raw.emit({ insetPx: 20, visible: true, visualHeight: 800 });
        expect(glided.getState().insetPx).toBe(20);
        expect(rafQueue.size).toBe(0);
    });

    it('glides a jump, monotonically, and lands exactly on the reported target', () => {
        const { raw, glided, seen } = make();
        raw.emit({ insetPx: 300, visualHeight: 500, visible: true });
        // The report itself only moves the non-interpolated fields.
        expect(geo(glided)).toEqual([0, 800]);
        expect(glided.getState().visible).toBe(true);
        const p = insetPath(glided, 6, 20);
        expect(p).toEqual([...p].sort((a, b) => a - b));
        expect(geo(glided)).toEqual([300, 500]);
        const settled = seen.length;
        frame(20);
        expect(seen.length).toBe(settled);
    });

    it('runs the first segment as ease-out cubic', () => {
        const { raw, glided } = make();
        raw.emit({ insetPx: 300, visualHeight: 500, visible: true });
        frame(60); // half the 120ms segment: 1 − 0.5³ = 0.875 of the way
        expect(geo(glided)).toEqual([263, 538]);
    });

    it('retargets mid-glide with continuous velocity, landing on the new target', () => {
        const { raw, glided } = make();
        raw.emit({ insetPx: 300, visualHeight: 500, visible: true });
        frame(80); // late in the segment, where an ease-out restart saw-tooths
        const a = glided.getState().insetPx;
        frame(16);
        const b = glided.getState().insetPx;
        const pre = b - a;
        raw.emit({ insetPx: 420, visualHeight: 380, visible: true });
        frame(16);
        const post = glided.getState().insetPx - b;
        expect(post).toBeGreaterThan(0);
        expect(Math.abs(post - pre)).toBeLessThanOrEqual(0.3 * pre);
        frame(120);
        expect(rafQueue.size).toBe(0);
        expect(geo(glided)).toEqual([420, 380]);
    });

    it('advances every frame under a per-frame report stream', () => {
        const { raw, glided } = make();
        // A report lands before the frame's rAF callbacks, the way a viewport event does.
        const p: number[] = [];
        for (let i = 1; i <= 6; i++) {
            clock += 16;
            raw.emit({ insetPx: 60 * i, visualHeight: 800 - 60 * i, visible: true });
            frame(0);
            p.push(glided.getState().insetPx);
        }
        for (let i = 1; i < p.length; i++) expect(p[i]).toBeGreaterThan(p[i - 1]);
        frame(120); // the last report's own segment
        expect(geo(glided)).toEqual([360, 440]);
        expect(rafQueue.size).toBe(0);
    });

    it('publishes raw when the layout viewport resized, and glides it when it held still', () => {
        const resized = make();
        resize(390, 500);
        resized.raw.emit({ insetPx: 0, visualHeight: 500, visible: true });
        expect(resized.glided.getState().visualHeight).toBe(500);
        expect(rafQueue.size).toBe(0);
        resize(390, 800);
        const overlay = make();
        overlay.raw.emit({ insetPx: 0, visualHeight: 500, visible: true });
        expect(overlay.glided.getState().visualHeight).toBe(800);
        expect(rafQueue.size).toBe(1);
        frame(120);
        expect(overlay.glided.getState().visualHeight).toBe(500);
    });

    it('snaps inset/visual to a host layout-viewport step while gliding layoutHeight', () => {
        const { raw, glided } = make();
        resize(390, 500);
        raw.emit({ insetPx: 0, visualHeight: 500, layoutHeight: 500, visible: true });
        expect(geo(glided)).toEqual([0, 500]);
        expect(glided.getState().layoutHeight).toBe(800);
        frame(60);
        const mid = glided.getState().layoutHeight;
        expect(mid).toBeGreaterThan(500);
        expect(mid).toBeLessThan(800);
        frame(60);
        expect(glided.getState().layoutHeight).toBe(500);
        expect(rafQueue.size).toBe(0);
    });

    it('keeps the layout glide alive when a report lands at unchanged innerHeight', () => {
        const { raw, glided } = make();
        resize(390, 500);
        raw.emit({ insetPx: 0, visualHeight: 500, layoutHeight: 500, visible: true });
        frame(30);
        // The visualViewport skew the host emits one frame after a step must not end the ease.
        raw.emit({ insetPx: 0, visualHeight: 474, layoutHeight: 500, visible: true });
        const mid = glided.getState().layoutHeight;
        expect(mid).toBeGreaterThan(500);
        expect(mid).toBeLessThan(800);
        frame(120);
        expect(glided.getState().layoutHeight).toBe(500);
    });

    it('snaps layoutHeight on rotation', () => {
        const { raw, glided } = make();
        resize(844, 390);
        raw.emit({ insetPx: 0, visualHeight: 390, layoutHeight: 390, visible: false });
        expect(glided.getState().layoutHeight).toBe(390);
        expect(rafQueue.size).toBe(0);
    });

    it('drops `visible` with the dismissal report and eases the inset to 0', () => {
        const { raw, glided, seen } = make();
        raw.emit({ insetPx: 300, visualHeight: 500, visible: true });
        frame(120);
        seen.length = 0;
        raw.emit({ insetPx: 0, visualHeight: 800, visible: false });
        expect(seen[0].visible).toBe(false);
        expect(seen[0].insetPx).toBe(300);
        const p = insetPath(glided, 6, 20);
        expect(p).toEqual([...p].sort((a, b) => b - a));
        expect(geo(glided)).toEqual([0, 800]);
    });

    it('snaps on rotation', () => {
        const { raw, glided } = make();
        raw.emit({ insetPx: 300, visualHeight: 500, visible: true });
        frame(40);
        resize(844, 800);
        raw.emit({ insetPx: 260, visualHeight: 130, visible: true });
        expect(geo(glided)).toEqual([260, 130]);
        expect(rafQueue.size).toBe(0);
    });

    it('cancels the in-flight frame and the raw subscription with the last listener', () => {
        const raw = new FakeTracker();
        const glided = withKeyboardGlide(raw, { glide: true });
        const un1 = glided.subscribe(() => {});
        const un2 = glided.subscribe(() => {});
        expect(raw.listeners.size).toBe(1);
        raw.emit({ visualHeight: 800 });
        raw.emit({ insetPx: 300, visualHeight: 500, visible: true });
        frame(20);
        un1();
        expect(raw.listeners.size).toBe(1);
        un2();
        expect(raw.listeners.size).toBe(0);
        expect(rafQueue.size).toBe(0);
        expect(cancelled.length).toBe(1);
        glided.setOverride(320);
        glided.destroy();
        expect(raw.overrides).toEqual([320]);
        expect(raw.destroyed).toBe(true);
    });
});

describe('getSharedKeyboardGlide', () => {
    afterEach(() => {
        const g = globalThis as Record<PropertyKey, unknown>;
        delete g[Symbol.for('@sparcs-kaist/keyboard-inset:shared-glide')];
        getSharedKeyboardTracker().destroy();
    });

    it('caches one instance per glide options, and is the plain tracker when off', () => {
        const plain = getSharedKeyboardTracker();
        expect(getSharedKeyboardGlide()).toBe(plain);
        expect(getSharedKeyboardGlide({ glide: false })).toBe(plain);
        const a = getSharedKeyboardGlide({ glide: true });
        expect(a).not.toBe(plain);
        expect(getSharedKeyboardGlide({ glide: true })).toBe(a);
        expect(getSharedKeyboardGlide({ glide: true, glideThresholdPx: 8 })).not.toBe(a);
        // Callers pass their whole hook options; only the glide ones split the cache.
        expect(getSharedKeyboardGlide({ glide: true, prefix: 'ara' })).toBe(a);
        a.destroy();
        expect(getSharedKeyboardGlide({ glide: true })).not.toBe(a);
    });
});
