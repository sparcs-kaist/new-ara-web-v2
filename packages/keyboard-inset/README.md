# @sparcs-kaist/keyboard-inset

Framework-agnostic soft-keyboard inset tracking for mobile web apps and WebViews, with React bindings.

The mobile soft keyboard is the last part of the web platform where every runtime behaves differently:

| Runtime | Layout viewport | Visual viewport | What your fixed-bottom bar does |
|---|---|---|---|
| Android WebView (`adjustResize`) | shrinks | shrinks | already correct at `bottom: 0` |
| Android Chrome ≥ 108 (default `resizes-visual`) | static | shrinks | hides behind the keyboard |
| Android WebView M139+ under `adjustPan` | static | shrinks | hides behind the keyboard |
| iOS Safari / WKWebView | static | shrinks **and pans** | hides behind the keyboard |
| Desktop | static | static | fine |

This package reduces all of that to one number:

> **`insetPx`** — how many CSS px of the *layout* viewport's bottom edge the keyboard occludes.
> Lift `position: fixed; bottom: 0` elements by exactly this much. It is `0` in runtimes that already
> resize the layout viewport, so you can apply it unconditionally.

It also encodes the quirks you would otherwise rediscover one incident at a time:

- **iOS late/stuck geometry** — the closing `visualViewport` resize arrives up to ~1s after dismissal, and
  iOS 26.0 leaves a ~24px residue forever ([WebKit #297779](https://bugs.webkit.org/show_bug.cgi?id=297779)).
  The inset is gated on an editable element actually owning focus, so it collapses to 0 the moment the
  keyboard goes away.
- **Unmounted focus** — WebKit fires no `blur` when the focused element is removed from the DOM (route
  changes). Focus is re-derived from `document.activeElement` on every evaluation.
- **Android per-frame IME animation** — `innerHeight` and `visualViewport.height` can lag each other by a
  frame, spiking the measured occlusion. Samples must agree across two consecutive frames to be published.
- **Chromium visual-viewport pan** — panning drives occlusion back to 0 while the keyboard is plainly up.
  Visibility is a latch that only releases on blur or the true closed signature
  (`visualViewport.height` back ≈ `innerHeight`).
- **WKWebView stuck offset after dismissal** ([WebKit #192564](https://bugs.webkit.org/show_bug.cgi?id=192564)) —
  fixed with a no-op scroll write-back. Focus is never touched.
- **Native bridge feeds that double-lift** — `setOverride()` takes the *raw* native keyboard height and
  subtracts any observed layout-viewport shrink, so a WebView host that already resizes with the keyboard
  contributes ~0 instead of lifting your composer twice.

## Install

```sh
npm install @sparcs-kaist/keyboard-inset
```

## Core (no framework)

```ts
import { createKeyboardTracker, publishKeyboardCssVars } from '@sparcs-kaist/keyboard-inset';

const tracker = createKeyboardTracker();
const unsubscribe = tracker.subscribe((s) => {
  console.log(s.visible, s.insetPx, s.mode, s.visualHeight);
});

// Or let CSS do the layout:
const stop = publishKeyboardCssVars(tracker);
// publishes on <html>:
//   --kb-inset: 0px;        /* px the keyboard occludes */
//   --kb-visible: 0;        /* unitless 0 | 1 */
//   --kb-visual-height: 812px;
```

Pin a composer above the keyboard **and** above the home indicator, in pure CSS:

```css
.composer {
  position: fixed;
  inset-inline: 0;
  /* keyboard open  -> flush against the keyboard (inset covers the safe area)
     keyboard closed -> resting on the home-indicator safe area */
  bottom: max(
    var(--kb-inset, 0px),
    calc(env(safe-area-inset-bottom, 0px) * (1 - var(--kb-visible, 0)))
  );
}
```

Size a chat screen that shrinks above the keyboard (pan-invariant, unlike `100dvh` math):

```css
.chat-shell {
  height: var(--kb-visual-height, 100dvh);
}
```

## React

```tsx
'use client';
import { useKeyboard, useKeyboardCssVars, useBottomAnchoredScroll } from '@sparcs-kaist/keyboard-inset/react';

function Shell({ children }) {
  useKeyboardCssVars(); // publish --kb-* on <html> for the lifetime of the shell
  return children;
}

function Composer() {
  const { visible, insetPx } = useKeyboard();
  // ...
}

function MessageList() {
  const ref = useRef<HTMLDivElement>(null);
  // Keeps the list glued to the bottom when the keyboard shrinks it —
  // users who scrolled up keep their reading position.
  useBottomAnchoredScroll(ref);
  return <div ref={ref} className="overflow-y-auto" />;
}
```

## WebView bridge feed (optional)

If your native host reports keyboard geometry, feed it in — the tracker normalizes it so a
resize-mode host cannot double-lift:

```ts
import { getSharedKeyboardTracker } from '@sparcs-kaist/keyboard-inset';

onNativeKeyboardEvent(({ visible, height }) => {
  getSharedKeyboardTracker().setOverride(visible ? height : null);
});
```

## Companion viewport meta (Chromium)

For plain Android Chrome (≥ 108 defaults to `resizes-visual`), opting back into layout-viewport
resizing makes browsers behave like an `adjustResize` WebView and lets flex layouts shrink natively:

```html
<meta name="viewport" content="width=device-width, initial-scale=1, interactive-widget=resizes-content">
```

This is recommended but not required — without it, `insetPx` simply becomes non-zero on those browsers.

## API

See the TypeScript declarations for full docs. Summary:

- `createKeyboardTracker(options?)` → `KeyboardTracker` — `getState()`, `subscribe(cb)`, `setOverride(px|null)`, `destroy()`
- `getSharedKeyboardTracker()` — lazy shared instance (used by the React hooks); HMR-safe
- `publishKeyboardCssVars(tracker, { target?, prefix? })` → unsubscribe
- `isEditableElement(el)` — the focus heuristic used internally
- `KeyboardState` — `{ visible, insetPx, mode: 'resize'|'overlay'|'unknown', visualHeight, editableFocused, source }`
- Options: `minKeyboardHeight` (50), `residualEpsilon` (32), `iosDismissFix` (true)
- React: `useKeyboard(tracker?)`, `useKeyboardCssVars(opts?)`, `useBottomAnchoredScroll(ref, { slack? })`

## Known limits

- A geometry-only detector cannot distinguish a window-height-only resize that happens *while an
  editable is focused* from a keyboard: Android split-screen and dragging a desktop window's bottom
  edge both report `visible: true` spuriously (every keyboard library shares this blind spot).
- iPad floating/split keyboards occlude nothing and therefore report `insetPx: 0, visible: false` —
  which is layout-correct, even if philosophically debatable.
- `useBottomAnchoredScroll` binds to the element present at mount; keep the scroll container mounted
  for the hook's lifetime (conditionally remounting it detaches the observer).
- `destroy()` on the shared tracker is process-global: every subscriber loses its callback and the
  next `getSharedKeyboardTracker()` call builds a fresh instance. Prefer letting the ref-counted
  subscriptions manage listener lifetime.
- SSR-safe: on the server all APIs are inert and `useKeyboard` returns the closed state.

## License

MIT © SPARCS
