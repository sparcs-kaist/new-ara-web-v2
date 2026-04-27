# Ara WebView ↔ Native Bridge Protocol

This document defines the message contract between the Next.js web app
(running inside a single `WebView`) and the native Flutter shell that hosts it.

The single source of truth for **types** is `./types.ts` (web side) and
`new-ara-app/lib/bridge/bridge_types.dart` (native side). Keep them in sync
when adding/removing messages.

> Channel name: `FlutterChannel`
> Direction: bidirectional
> Transport: stringified JSON (with backwards-compat for legacy plain strings)

---

## 1. Wire format

### Web → Native
The web calls
```ts
window.FlutterChannel.postMessage(JSON.stringify(envelope))
```

`envelope` shape:
```ts
{
  v: 1,                  // protocol version
  id?: string,           // optional, used to correlate responses
  type: string,          // command name, see §3
  payload?: unknown      // command-specific data
}
```

**Legacy compatibility:** If a postMessage value is *not* a JSON object with
`v`, the native side falls back to the legacy string protocol used by
`PostWrite` and `Meal` pages (e.g. `'PostWritePageExit'`, `'meal_page_exit'`).
New code MUST use the JSON envelope.

### Native → Web
The native side dispatches a `CustomEvent` on `window`:
```js
window.dispatchEvent(new CustomEvent('flutter:message', { detail: envelope }))
```

`envelope` shape (responses or events):
```ts
{
  v: 1,
  id?: string,           // mirrors the request id, for response correlation
  type: string,          // event name or '<requestType>:result'
  payload?: unknown,
  error?: { code: string, message: string }
}
```

The web client also exposes a global `window.AraBridge` (see `client.ts`)
which wraps both directions with a `request<T>(type, payload)` Promise API.

---

## 2. Lifecycle

1. Native creates the WebView, injects the `FlutterChannel` JS handler, loads
   `https://newara.dev.sparcs.org/web_view/Main`.
2. On DOMContentLoaded, web sends `{ type: 'ready', payload: { route } }`.
3. Native responds with `{ type: 'bridge:ready', payload: { platform, osVersion, appVersion, locale, safeArea } }`.
4. Web stores capabilities; from this point on, `window.AraBridge.isNative === true`.
5. If not in a WebView, `bridge:ready` never arrives within 500ms; web falls
   back to "browser mode" and bridge methods become no-ops (or throw).

---

## 3. Web → Native commands

All commands are best-effort — native may respond with an error envelope.

| `type`                    | `payload`                                 | `result`                              | Notes |
|---------------------------|-------------------------------------------|----------------------------------------|-------|
| `ready`                   | `{ route: string }`                       | —                                      | Sent once on first paint. |
| `log`                     | `{ level, message, data? }`               | —                                      | Forward to native console. |
| `goBack`                  | —                                         | —                                      | Pop a native screen if any; otherwise `history.back()`. |
| `exit`                    | —                                         | —                                      | Replaces legacy `'PostWritePageExit'` / `'meal_page_exit'` strings. |
| `setStatusBar`            | `{ color: '#RRGGBB', style: 'light'\|'dark' }` | —                                  | Tint status bar. |
| `setSafeArea`             | `{ top, bottom, left, right }`            | —                                      | Reserved for future. |
| `openExternal`            | `{ url: string }`                         | —                                      | Open in external browser. |
| `share`                   | `{ title?, text?, url? }`                 | `{ shared: boolean }`                  | OS share sheet. |
| `pickImage`               | `{ source: 'gallery'\|'camera', maxBytes? }` | `{ uri: string, mime: string, name: string, base64?: string }` | Returns a temporary uri the web can upload directly via fetch. |
| `pickFile`                | `{ accept?: string[], multiple?: boolean }` | `{ files: { uri, mime, name, size }[] }` | |
| `requestPermission`       | `{ kind: 'camera'\|'photos'\|'notifications'\|'microphone' }` | `{ granted: boolean, status: 'granted'\|'denied'\|'permanentlyDenied' }` | |
| `getPushToken`            | —                                         | `{ token: string\|null, platform: 'fcm'\|'apns' }` | |
| `subscribeTopic`          | `{ topic: string }`                       | —                                      | |
| `unsubscribeTopic`        | `{ topic: string }`                       | —                                      | |
| `setBadgeCount`           | `{ count: number }`                       | —                                      | iOS badge / Android indicator. |
| `haptic`                  | `{ kind: 'light'\|'medium'\|'heavy'\|'selection' }` | —                            | |
| `clipboardWrite`          | `{ text: string }`                        | —                                      | |
| `clipboardRead`           | —                                         | `{ text: string }`                     | |
| `setSession`              | `{ cookie: string }`                      | —                                      | Web hands updated session cookie to native (rare). |
| `clearSession`            | —                                         | —                                      | After logout. |
| `reportHeight`            | `{ height: number }`                      | —                                      | Legacy `HeightChannel` use case. |

---

## 4. Native → Web events

| `type`                | `payload`                                                  | When |
|-----------------------|------------------------------------------------------------|------|
| `bridge:ready`        | `{ platform, osVersion, appVersion, locale, safeArea }`    | After web sends `ready`. |
| `back:pressed`        | —                                                          | Android hardware back button. Web returns `{ handled: boolean }` via the response channel; if `false`, native pops/exits. |
| `appstate:changed`    | `{ state: 'foreground'\|'background'\|'inactive' }`        | App lifecycle changes. |
| `network:changed`     | `{ online: boolean, type?: 'wifi'\|'cellular' }`           | Connectivity changes. |
| `keyboard:changed`    | `{ height: number, visible: boolean }`                     | iOS only — Android relies on visualViewport. |
| `push:received`       | `{ title?, body?, data?, foreground: boolean }`            | A push arrived (foreground or background-tap). |
| `push:opened`         | `{ data, deepLink?: string }`                              | User tapped a push. |
| `deeplink:received`   | `{ url: string }`                                          | App opened via custom scheme or universal link. |
| `auth:expired`        | —                                                          | Native detected a 401 (rare, web normally does this). |
| `<requestType>:result`| see §3                                                     | Response to a Web→Native request. |
| `<requestType>:error` | `{ error: { code, message } }`                             | Error response. |

---

## 5. Errors

```ts
type BridgeError =
  | 'unsupported'        // unknown command for this app version
  | 'denied'             // permission denied
  | 'cancelled'          // user cancelled
  | 'invalid_payload'    // bad input
  | 'unavailable'        // feature not available on this platform
  | 'internal'           // unexpected
```

---

## 6. Versioning

- Increment `v` only on a breaking change.
- Add new `type`s freely; web should feature-detect via `bridge:ready.payload.appVersion`
  or by sending the request and handling `unsupported`.
