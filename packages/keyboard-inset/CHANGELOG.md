# Changelog

## 0.1.0 (unreleased)

Initial version, extracted from the new-ara webview shell.

- Core: `createKeyboardTracker` / `getSharedKeyboardTracker` / `publishKeyboardCssVars`
  - occlusion geometry (`innerHeight − visualViewport.height − offsetTop`) with focus gating,
    per-presentation visibility latch, resize/overlay mode classification, two-frame sample
    stability filter, orientation guard
  - iOS 26 residual clamp (WebKit #297779), WKWebView dismiss write-back (WebKit #192564)
  - `setOverride` normalizes raw native keyboard heights against observed layout shrink
- React: `useKeyboard`, `useKeyboardCssVars`, `useBottomAnchoredScroll`
