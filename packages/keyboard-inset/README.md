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

## Bottom-anchored scrolling

Pinning content to the bottom edge while the keyboard resizes the viewport is a
second problem the inset alone doesn't solve. `createBottomAnchor` compensates
the scroll position so the bottom stays put across height changes, on either an
inner scroll container or the document scroller:

```ts
import { createBottomAnchor } from '@sparcs-kaist/keyboard-inset';

const detach = createBottomAnchor(listEl, { pin: 'always' });   // inner chat column
const detach = createBottomAnchor(window, { pin: 'always' });   // page with a fixed composer
```

Two pin modes, because the right UX differs per surface — choosing between them
is the point of the API:

| `pin` | When the keyboard opens | Fits |
|---|---|---|
| `'at-bottom'` (default) | re-glue to the bottom edge **only if the user was already there**; a user who scrolled up keeps their reading position | forum / feed, timelines, comment lists read top-down |
| `'always'` | preserve whatever sits at the bottom edge **wherever the user is** — the viewport folds up against the keyboard | messenger surfaces: KakaoTalk, Instagram DM, Slack |

**Element target** compensates on `ResizeObserver` ticks — the container box is
the signal, so content growth (new messages) never fires it. Because scroll
steps run before the observer within a frame, only a scroll bearing the engine
clamp's signature — a grow in flight landing exactly at the new bottom — is
swallowed (it must not re-baseline the stored gap the tick is about to read);
every other scroll, including a user drag mid-animation, re-baselines the gap
live. A width change re-glues a user who was at the
bottom in **either** mode — being at the bottom is reflow-invariant.
`startAtBottom` (default true) scrolls to the bottom on attach, which is what a
chat column wants on mount.

**Window target** compensates on `resize` synchronously, so on hosts that
resize the layout viewport per-frame with the IME animation (the NewAra Flutter
shell, an `adjustResize` WebView) the content tracks the keyboard frame-by-frame
instead of being swallowed and jumping at the end. Because it moves the whole
page, it is hardened against browser-chrome noise:

- **Focus gate** — a shrink engages compensation only when an editable owns
  focus, the tracker latched a keyboard, or a compensated presentation is
  already open (focus can race the closing frames). A collapsing URL bar never
  moves the page.
- **Debt-bounded grow compensation** — grow (fold-out) is capped at the
  *nominal* shrink debt (px admitted through the focus gate), drained by the
  grow delta itself rather than by achieved scroll movement, so a fold-out that
  clamps at the top can't strand debt and chrome *growth* can't drift the page
  past where it started.
- **Direction-dependent gap baseline** — a shrink (fold-in) is never
  engine-clamped, so its gap is read *fresh* against the pre-event height; a
  post body that loads silently after mount (no scroll or resize event) thus
  can't corrupt the fold. A grow (fold-out) also prefers the *fresh* gap and
  falls back to the *stored* gap only when the geometry bears the engine
  clamp's signature (`scrollY` pinned at the document bottom): a silent grow
  under an open keyboard moves the bottom away from the user and so can never
  fake the signature, keeping a post that grew mid-fold (placeholder→data swap,
  composer auto-grow) from jumping the page on dismissal.
- **Overlay carry ledger** — a fold-in that clamps at the physical document
  edge (overlay hosts can't scroll past the end) records the un-foldable
  shortfall and fold-out repays it, so the page returns to the user's true gap
  instead of drifting up by the keyboard height. Window writes force instant
  scroll (overriding a consumer's `scroll-behavior: smooth`) so the shortfall
  readback taken right after a write measures real geometry, not a
  mid-animation phantom.
- **`effectiveHeight` = layout height − overlay inset** — resize-mode hosts move
  the layout term, overlay hosts (plain iOS Safari) move the inset; one delta
  stream covers both.
- **Orientation reset** — a width change makes heights incomparable, so the
  outstanding debt and carry are dropped and geometry restarts from the new size.
- `startAtBottom` is **element-only** — the window target must never move the
  page on attach.

```ts
const detach = createBottomAnchor(window, { pin: 'at-bottom', slack: 40 });
detach();
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

`useBottomAnchoredScroll` takes the same `pin` option — pass `pin: 'always'`
for a messenger column, leave it at `'at-bottom'` for a feed. For pages that
scroll the window rather than an inner column (a post with a fixed comment
composer), use `useWindowBottomAnchoredScroll`, which defaults to `'always'`
and never moves the page on mount:

```tsx
import { useWindowBottomAnchoredScroll } from '@sparcs-kaist/keyboard-inset/react';

function PostPage() {
  // folds the article up against the keyboard when the composer focuses;
  // keyboard-gated, so browser-chrome resizes can't drift it
  useWindowBottomAnchoredScroll();
  return <article>…</article>;
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
- `createBottomAnchor(target, { pin?, slack?, startAtBottom?, tracker? })` → detach — bottom-pins an `HTMLElement` or `window` across keyboard resizes
- `isEditableElement(el)` — the focus heuristic used internally
- `KeyboardState` — `{ visible, insetPx, mode: 'resize'|'overlay'|'unknown', visualHeight, editableFocused, source }`
- `ScrollPinMode` — `'at-bottom' | 'always'`
- Options: `minKeyboardHeight` (50), `residualEpsilon` (32), `iosDismissFix` (true)
- React: `useKeyboard(tracker?)`, `useKeyboardCssVars(opts?)`, `useBottomAnchoredScroll(ref, { pin?, slack?, startAtBottom? })`, `useWindowBottomAnchoredScroll({ pin?, slack? })`

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
