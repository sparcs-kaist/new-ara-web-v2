import type { KeyboardTracker } from '@sparcs-kaist/keyboard-inset';

/**
 * Predicted keyboard SHOW for Android resize hosts, whose first window resize
 * lands ~460ms after focusin — long after the IME has finished sliding up.
 * On focusin we replay the IME curve from the last learned height, owning
 * --ara-kb-column / --ara-kb-shrink, then ease onto the settled geometry and
 * hand ownership back. Show only: the area the keyboard vacates is not painted
 * until the late resize, so growing early would push content under the
 * surface edge. The fixed post composer is not lifted (the window fold cannot
 * scroll into range that does not exist yet).
 */
export interface KeyboardPredictorOptions {
    tracker: KeyboardTracker;
    publish: (column: number | null, shrink: number) => void;
    getMaxHeight: () => number;
    isEditable: (el: Element | null) => boolean;
    enabled?: () => boolean;
    fallbackPx?: () => number;
}

export interface KeyboardPredictor {
    readonly active: boolean;
    readonly lift: number | null;
    learn(kbPx: number): void;
    stop(): void;
    destroy(): void;
}

const ARM_DELAY_MS = 80;
const IME_MS = 285;
const SETTLE_MS = 150;
const NO_SHOW_MS = 900;
const MAX_RUN_MS = 2000;
const RELEASE_MS = 120;
const MIN_KB_PX = 100;

export function cubicBezier(x1: number, y1: number, x2: number, y2: number): (u: number) => number {
    const cx = 3 * x1;
    const bx = 3 * (x2 - x1) - cx;
    const ax = 1 - cx - bx;
    const cy = 3 * y1;
    const by = 3 * (y2 - y1) - cy;
    const ay = 1 - cy - by;
    return (u) => {
        let t = u;
        for (let i = 0; i < 6; i++) {
            const d = (3 * ax * t + 2 * bx) * t + cx;
            if (d === 0) break;
            t -= (((ax * t + bx) * t + cx) * t - u) / d;
        }
        return ((ay * t + by) * t + cy) * t;
    };
}

/** Android InsetsController SYNC_IME. */
export const imeCurve = cubicBezier(0.2, 0, 0, 1);

export function createKeyboardPredictor(opts: KeyboardPredictorOptions): KeyboardPredictor {
    const { tracker, publish, getMaxHeight, isEditable, enabled = () => true, fallbackPx } = opts;
    const memo = new Map<string, number>();
    let rafId: number | null = null;
    let running = false;
    let startAt = 0;
    let learnedPx = 0;
    let column = 0;
    let sawResize = false;
    let lastResizeAt = 0;
    let armWidth = 0;
    let release: { from: number; to: number; startedAt: number } | null = null;

    const key = (): string => `ara:kb:${window.innerWidth}x${getMaxHeight()}`;
    const load = (k: string): number => {
        const hit = memo.get(k);
        if (hit !== undefined) return hit;
        let px = 0;
        try { px = Number(window.localStorage.getItem(k)) || 0; } catch { /* blocked storage */ }
        memo.set(k, px);
        return px;
    };

    const schedule = (): void => {
        if (rafId === null) rafId = requestAnimationFrame(tick);
    };

    const emit = (next: number): void => {
        column = next;
        publish(next, Math.max(0, getMaxHeight() - next));
    };

    const finish = (): void => {
        running = false;
        release = null;
        if (rafId !== null) cancelAnimationFrame(rafId);
        rafId = null;
        publish(null, Math.max(0, getMaxHeight() - window.innerHeight));
    };

    const startRelease = (now: number): void => {
        const max = getMaxHeight();
        release = { from: column, to: window.innerHeight < max ? window.innerHeight : max, startedAt: now };
    };

    function tick(): void {
        rafId = null;
        if (!running) return;
        const now = performance.now();
        if (release) {
            const t = Math.min(1, (now - release.startedAt) / RELEASE_MS);
            emit(release.from + (release.to - release.from) * (1 - (1 - t) ** 3));
            if (t >= 1) { finish(); return; }
            schedule();
            return;
        }
        emit(getMaxHeight() - learnedPx * imeCurve(Math.min(1, Math.max(0, (now - startAt) / IME_MS))));
        // Every arm releases: quiet after the resizes, quiet with none at all, or the cap.
        const quiet = sawResize ? now - lastResizeAt >= SETTLE_MS : now - startAt >= NO_SHOW_MS;
        if (quiet || now - startAt >= MAX_RUN_MS) startRelease(now);
        schedule();
    }

    const onFocusIn = (e: FocusEvent): void => {
        // The last learned height, else the host's default; with neither, never arm.
        if (running || !enabled() || !isEditable(e.target as Element | null)) return;
        if (window.innerHeight !== getMaxHeight() || tracker.getState().visible) return;
        learnedPx = load(key()) || (fallbackPx?.() ?? 0);
        if (!learnedPx) return;
        running = true;
        release = null;
        sawResize = false;
        armWidth = window.innerWidth;
        column = getMaxHeight();
        startAt = performance.now() + ARM_DELAY_MS;
        schedule();
    };

    const onFocusOut = (e: FocusEvent): void => {
        if (!running || release || isEditable(e.relatedTarget as Element | null)) return;
        startRelease(performance.now());
    };

    const onResize = (): void => {
        if (!running) return;
        const now = performance.now();
        // A resize before the curve even starts means the real signal was early enough.
        if ((!sawResize && now < startAt) || window.innerWidth !== armWidth) { finish(); return; }
        sawResize = true;
        lastResizeAt = now;
    };

    window.addEventListener('focusin', onFocusIn);
    window.addEventListener('focusout', onFocusOut);
    window.addEventListener('resize', onResize);

    return {
        get active() { return running; },
        get lift() { return running && !release ? getMaxHeight() - column : null; },
        learn(kbPx: number) {
            if (!(kbPx >= MIN_KB_PX)) return;
            const k = key();
            memo.set(k, Math.round(kbPx));
            try { window.localStorage.setItem(k, String(Math.round(kbPx))); } catch { /* blocked storage */ }
        },
        stop() {
            if (running) finish();
        },
        destroy() {
            window.removeEventListener('focusin', onFocusIn);
            window.removeEventListener('focusout', onFocusOut);
            window.removeEventListener('resize', onResize);
            if (running) finish();
        },
    };
}
