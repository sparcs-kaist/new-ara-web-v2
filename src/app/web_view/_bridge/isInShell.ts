/** True when this document runs inside the native shell (which injects `window.FlutterChannel`). */
export function isInShell(): boolean {
    return typeof window !== 'undefined' && typeof window.FlutterChannel?.postMessage === 'function';
}
