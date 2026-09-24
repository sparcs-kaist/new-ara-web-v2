import type { KeyboardTracker } from '@sparcs-kaist/keyboard-inset';
import { cubicBezier, imeCurve } from './keyboardPredict';

/**
 * Replays the shell's one-shot keyboard:changed (sent at IME animation start
 * with the FINAL height) along the platform curve into the raw tracker's
 * override. The tracker normalizes it against the late layout shrink, so a
 * resize host's staircase landing mid-replay never double-lifts.
 */
export interface KeyboardReplay {
    play(p: { height: number; visible: boolean; durationMs?: number; curve?: string }): void;
    readonly received: boolean;
    readonly holding: boolean;
    destroy(): void;
}

const DEFAULT_MS = 285;
const SETTLE_MS = 300;
const iosCurve = cubicBezier(0.38, 0.7, 0.125, 1);

export function createKeyboardReplay({ tracker }: { tracker: KeyboardTracker }): KeyboardReplay {
    let rafId: number | null = null;
    let settleTimer: number | undefined;
    let current: number | null = null;
    let received = false;
    let holding = false;

    const set = (px: number | null): void => {
        current = px;
        tracker.setOverride(px);
        // The unclamped curve; the tracker's inset clamps at 0 when a resize step outruns it.
        const root = document.documentElement.style;
        if (px === null) root.removeProperty('--ara-kb-replay');
        else root.setProperty('--ara-kb-replay', `${px}px`);
    };

    const stop = (): void => {
        if (rafId !== null) cancelAnimationFrame(rafId);
        rafId = null;
        if (settleTimer !== undefined) window.clearTimeout(settleTimer);
        settleTimer = undefined;
    };

    const release = (): void => {
        settleTimer = undefined;
        set(null);
        holding = false;
    };

    return {
        get received() { return received; },
        get holding() { return holding; },
        play(p) {
            received = true;
            stop();
            // Without a live override, start from what geometry shows (an overlay host's open keyboard).
            const from = current ?? tracker.getState().insetPx;
            const to = p.visible ? p.height : 0;
            const duration = p.durationMs ?? DEFAULT_MS;
            const curve = p.curve === 'ios' ? iosCurve : imeCurve;
            const startedAt = performance.now();
            holding = p.visible;
            const tick = (): void => {
                rafId = null;
                const u = duration > 0 ? Math.min(1, (performance.now() - startedAt) / duration) : 1;
                set(from + (to - from) * curve(u));
                if (u < 1) { rafId = requestAnimationFrame(tick); return; }
                if (p.visible) settleTimer = window.setTimeout(release, SETTLE_MS);
                else release();
            };
            tick();
        },
        destroy() {
            stop();
            if (current !== null) set(null);
            holding = false;
        },
    };
}
