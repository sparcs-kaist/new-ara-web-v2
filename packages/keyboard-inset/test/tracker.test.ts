import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
    createKeyboardTracker,
    getSharedKeyboardTracker,
    isEditableElement,
    type KeyboardState,
    type KeyboardTracker,
} from '../src/tracker';
import { publishKeyboardCssVars } from '../src/css-vars';

/**
 * Harness: fake visualViewport + manually flushed rAF.
 *
 * The tracker coalesces every signal through requestAnimationFrame and
 * requires two consecutive agreeing samples before trusting occlusion, so
 * tests drive it with explicit frame flushes.
 */

class FakeVisualViewport extends EventTarget {
    height = 800;
    offsetTop = 0;
    width = 390;
}

let vv: FakeVisualViewport;
let rafQueue: FrameRequestCallback[];
let tracker: KeyboardTracker | null;

function flushFrames(n = 4): void {
    for (let i = 0; i < n; i++) {
        const q = rafQueue;
        rafQueue = [];
        for (const cb of q) cb(performance.now());
    }
}

function setViewport({ innerHeight, vvHeight, offsetTop = 0 }: {
    innerHeight?: number; vvHeight?: number; offsetTop?: number;
}): void {
    if (innerHeight !== undefined) {
        (window as unknown as { innerHeight: number }).innerHeight = innerHeight;
        window.dispatchEvent(new Event('resize'));
    }
    if (vvHeight !== undefined) vv.height = vvHeight;
    vv.offsetTop = offsetTop;
    vv.dispatchEvent(new Event('resize'));
}

function focusEditable(): HTMLTextAreaElement {
    const ta = document.createElement('textarea');
    document.body.appendChild(ta);
    ta.focus();
    window.dispatchEvent(new Event('focusin'));
    return ta;
}

function blur(el: HTMLElement): void {
    el.blur();
    window.dispatchEvent(new Event('focusout'));
}

function makeTracker(): { t: KeyboardTracker; states: KeyboardState[]; unsub: () => void } {
    const t = createKeyboardTracker();
    tracker = t;
    const states: KeyboardState[] = [];
    const unsub = t.subscribe((s) => states.push(s));
    flushFrames();
    return { t, states, unsub };
}

beforeEach(() => {
    vv = new FakeVisualViewport();
    Object.defineProperty(window, 'visualViewport', { value: vv, configurable: true });
    (window as unknown as { innerHeight: number }).innerHeight = 800;
    (window as unknown as { innerWidth: number }).innerWidth = 390;
    rafQueue = [];
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
        rafQueue.push(cb);
        return rafQueue.length;
    });
    vi.stubGlobal('cancelAnimationFrame', () => {});
});

afterEach(() => {
    tracker?.destroy();
    tracker = null;
    document.body.innerHTML = '';
    vi.unstubAllGlobals();
});

describe('overlay mode (iOS Safari / WKWebView, Chrome resizes-visual)', () => {
    it('reports the occlusion as insetPx while an editable is focused', () => {
        const { t } = makeTracker();
        const ta = focusEditable();
        flushFrames();
        setViewport({ vvHeight: 500 }); // keyboard 300, layout viewport unchanged
        flushFrames();

        const s = t.getState();
        expect(s.visible).toBe(true);
        expect(s.mode).toBe('overlay');
        expect(s.insetPx).toBe(300);
        expect(s.visualHeight).toBe(500);
        blur(ta);
    });

    it('accounts for visual-viewport pan via offsetTop and stays latched at full pan', () => {
        const { t } = makeTracker();
        focusEditable();
        flushFrames();
        setViewport({ vvHeight: 500 });
        flushFrames();
        // WebKit/Chromium pans the visual viewport to reveal the input:
        // occlusion drops (800 - 500 - 300 = 0) but the keyboard is still up.
        setViewport({ vvHeight: 500, offsetTop: 300 });
        flushFrames();

        const s = t.getState();
        expect(s.insetPx).toBe(0); // formula is exact for fixed-bottom elements under pan
        expect(s.visible).toBe(true); // latch holds: vv.height is still 300 short of innerHeight
    });

    it('drops insetPx to 0 immediately on blur even though the vv resize is late (iOS)', () => {
        const { t } = makeTracker();
        const ta = focusEditable();
        flushFrames();
        setViewport({ vvHeight: 500 });
        flushFrames();
        expect(t.getState().insetPx).toBe(300);

        // Blur; iOS will not deliver the closing resize for up to ~1s.
        blur(ta);
        flushFrames();
        const s = t.getState();
        expect(s.editableFocused).toBe(false);
        expect(s.visible).toBe(false);
        expect(s.insetPx).toBe(0); // gated on focus — no 300px ghost float

        // The late resize eventually lands; state stays closed.
        setViewport({ vvHeight: 800 });
        flushFrames();
        expect(t.getState().insetPx).toBe(0);
    });

    it('clamps the iOS 26 residual (~24px) after a focus-retained dismissal', () => {
        const { t } = makeTracker();
        focusEditable();
        flushFrames();
        setViewport({ vvHeight: 500 });
        flushFrames();
        // Keyboard hidden via the iPad hide key (focus retained); iOS 26
        // leaves vv.height 24px short.
        setViewport({ vvHeight: 776 });
        flushFrames();

        const s = t.getState();
        expect(s.visible).toBe(false); // latch released: vv back within epsilon
        expect(s.insetPx).toBe(0); // 24 <= residualEpsilon -> clamped
    });

    it('keeps a real accessory-bar inset (56px) with focus held, without claiming visible', () => {
        const { t } = makeTracker();
        focusEditable();
        flushFrames();
        setViewport({ vvHeight: 744 }); // hardware keyboard accessory bar
        flushFrames();

        const s = t.getState();
        expect(s.insetPx).toBe(56); // 56 > minKeyboardHeight -> latched visible
        expect(s.visible).toBe(true);
    });
});

describe('resize mode (Android adjustResize WebView, resizes-content)', () => {
    it('reports visible with insetPx 0 when the layout viewport shrinks', () => {
        const { t } = makeTracker();
        focusEditable();
        flushFrames();
        setViewport({ innerHeight: 500, vvHeight: 500 }); // both shrink together
        flushFrames();

        const s = t.getState();
        expect(s.visible).toBe(true);
        expect(s.mode).toBe('resize');
        expect(s.insetPx).toBe(0); // fixed bottom:0 already sits on the keyboard
    });

    it('suppresses transient occlusion spikes from innerHeight/vv.height frame skew', () => {
        const { t } = makeTracker();
        focusEditable();
        flushFrames();
        // Frame 1 of the IME animation: the two surfaces disagree for one
        // frame (vv already shrank further than the window) -> occlusion 60.
        (window as unknown as { innerHeight: number }).innerHeight = 760;
        vv.height = 700;
        window.dispatchEvent(new Event('resize'));
        flushFrames(1);
        // Next frame the surfaces agree again.
        (window as unknown as { innerHeight: number }).innerHeight = 500;
        vv.height = 500;
        window.dispatchEvent(new Event('resize'));
        flushFrames();

        const s = t.getState();
        expect(s.mode).toBe('resize');
        expect(s.insetPx).toBe(0); // the 60px single-frame spike never published
    });

    it('keeps the presentation alive across a focus transfer between fields', () => {
        const { t } = makeTracker();
        const first = focusEditable();
        flushFrames();
        setViewport({ innerHeight: 500, vvHeight: 500 });
        flushFrames();
        expect(t.getState().visible).toBe(true);

        // Transfer: blur + focus land before the next frame; keyboard stays up.
        const second = focusEditable();
        first.remove();
        flushFrames();

        const s = t.getState();
        expect(s.visible).toBe(true); // baseline survived the transfer
        expect(s.mode).toBe('resize');
        blur(second);
    });
});

describe('focus lifecycle robustness', () => {
    it('recovers when the focused element is unmounted without any blur event', () => {
        const { t } = makeTracker();
        const ta = focusEditable();
        flushFrames();
        setViewport({ vvHeight: 500 });
        flushFrames();
        expect(t.getState().visible).toBe(true);

        // Route change: React removes the node. WebKit fires NO focusout.
        ta.remove();
        // Something unrelated triggers an evaluation (any event would).
        setViewport({ vvHeight: 500 });
        flushFrames();

        const s = t.getState();
        expect(s.editableFocused).toBe(false); // re-derived from activeElement
        expect(s.visible).toBe(false);
        expect(s.insetPx).toBe(0);
    });
});

describe('setOverride (native bridge feed)', () => {
    it('normalizes a raw native height against an observed layout shrink (no double-lift)', () => {
        const { t } = makeTracker();
        focusEditable();
        flushFrames();
        setViewport({ innerHeight: 464, vvHeight: 464 }); // shell already resized by 336
        flushFrames();

        t.setOverride(336); // native reports raw keyboard height
        flushFrames();

        const s = t.getState();
        expect(s.source).toBe('override');
        expect(s.insetPx).toBe(0); // 336 - 336 shrink -> nothing left to lift
    });

    it('normalizes against the layout shrink even with no editable focused', () => {
        // Native reports the keyboard while web focus is absent (blur race,
        // focus on a native accessory): the shrink must still be recognized.
        const { t } = makeTracker();
        setViewport({ innerHeight: 464, vvHeight: 464 });
        flushFrames();
        t.setOverride(336);
        flushFrames();
        expect(t.getState().insetPx).toBe(0);
    });

    it('passes a raw height through when nothing resized (overlay host)', () => {
        const { t } = makeTracker();
        focusEditable();
        flushFrames();
        t.setOverride(336);
        flushFrames();

        const s = t.getState();
        expect(s.insetPx).toBe(336);
        expect(s.visible).toBe(true);

        t.setOverride(null);
        flushFrames();
        expect(t.getState().source).toBe('geometry');
    });

    it('publishes synchronously while attached (per-frame bridge feed must not lag a rAF)', () => {
        const { t } = makeTracker();
        focusEditable();
        flushFrames();

        t.setOverride(336);
        // No flushFrames: the state must already reflect the override.
        expect(t.getState().insetPx).toBe(336);
        expect(t.getState().source).toBe('override');

        t.setOverride(180);
        expect(t.getState().insetPx).toBe(180);

        t.setOverride(null);
        expect(t.getState().source).toBe('geometry');
    });
});

describe('publishKeyboardCssVars', () => {
    it('publishes immediately, tracks changes, and removes properties on unsubscribe', () => {
        const { t } = makeTracker();
        const stop = publishKeyboardCssVars(t);
        const html = document.documentElement;
        expect(html.style.getPropertyValue('--kb-inset')).toBe('0px');
        expect(html.style.getPropertyValue('--kb-visible')).toBe('0');

        focusEditable();
        flushFrames();
        setViewport({ vvHeight: 500 });
        flushFrames();
        expect(html.style.getPropertyValue('--kb-inset')).toBe('300px');
        expect(html.style.getPropertyValue('--kb-visible')).toBe('1');
        expect(html.style.getPropertyValue('--kb-visual-height')).toBe('500px');

        stop();
        expect(html.style.getPropertyValue('--kb-inset')).toBe('');
        expect(html.style.getPropertyValue('--kb-visible')).toBe('');
        expect(html.style.getPropertyValue('--kb-visual-height')).toBe('');
    });
});

describe('publishKeyboardCssVars visual-height guard', () => {
    it('leaves the stylesheet fallback in place until a real measurement exists', () => {
        const t = createKeyboardTracker();
        tracker = t;
        const stop = publishKeyboardCssVars(t); // state still INITIAL (visualHeight 0)
        expect(document.documentElement.style.getPropertyValue('--kb-visual-height')).toBe('');
        stop();
    });
});

describe('getSharedKeyboardTracker', () => {
    it('returns the same instance until destroyed, then recreates', () => {
        const a = getSharedKeyboardTracker();
        expect(getSharedKeyboardTracker()).toBe(a);
        a.destroy();
        const b = getSharedKeyboardTracker();
        expect(b).not.toBe(a);
        b.destroy();
    });
});

describe('isEditableElement', () => {
    it('classifies editable vs non-editable targets', () => {
        expect(isEditableElement(document.createElement('textarea'))).toBe(true);
        expect(isEditableElement(document.createElement('select'))).toBe(true);
        const text = document.createElement('input');
        expect(isEditableElement(text)).toBe(true);
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        expect(isEditableElement(checkbox)).toBe(false);
        const button = document.createElement('input');
        button.type = 'button';
        expect(isEditableElement(button)).toBe(false);
        expect(isEditableElement(document.createElement('div'))).toBe(false);
        expect(isEditableElement(null)).toBe(false);
    });
});

describe('orientation changes', () => {
    it('does not flag the keyboard when width changes with the height (rotation)', () => {
        const { t } = makeTracker();
        focusEditable();
        flushFrames();
        // Rotate: both dimensions change; no keyboard involved.
        (window as unknown as { innerWidth: number }).innerWidth = 800;
        (window as unknown as { innerHeight: number }).innerHeight = 390;
        vv.height = 390;
        window.dispatchEvent(new Event('resize'));
        flushFrames();

        const s = t.getState();
        expect(s.visible).toBe(false);
        expect(s.insetPx).toBe(0);
    });
});
