# Changelog

## 0.2.0

- Core: `createBottomAnchor(target, opts)` — bottom-anchored scrolling across
  keyboard-driven height changes, for an `HTMLElement` or the `window` scroller
  - two pin modes: `'at-bottom'` (re-glue only when the user was already at the
    bottom — feed style) and `'always'` (preserve the bottom edge wherever the
    user is — messenger-style fold)
  - element target compensates on `ResizeObserver`; window target compensates
    synchronously on `resize` so per-frame IME-animation resizes track
    frame-by-frame
  - window safety model: focus-gated shrink compensation, debt-bounded grow
    compensation, direction-dependent gap baseline (fresh-read shrink; grow
    fresh unless clamp-pinned at the bottom), overlay carry ledger, `effectiveHeight` = layout height −
    overlay inset, orientation reset — browser-chrome (URL bar) noise can't
    drift the page
- React: `pin` / `startAtBottom` options on `useBottomAnchoredScroll`; new
  `useWindowBottomAnchoredScroll` for pages that scroll the document

## 0.1.0 (unreleased)

Initial version, extracted from the new-ara webview shell.

- Core: `createKeyboardTracker` / `getSharedKeyboardTracker` / `publishKeyboardCssVars`
  - occlusion geometry (`innerHeight − visualViewport.height − offsetTop`) with focus gating,
    per-presentation visibility latch, resize/overlay mode classification, two-frame sample
    stability filter, orientation guard
  - iOS 26 residual clamp (WebKit #297779), WKWebView dismiss write-back (WebKit #192564)
  - `setOverride` normalizes raw native keyboard heights against observed layout shrink
- React: `useKeyboard`, `useKeyboardCssVars`, `useBottomAnchoredScroll`
