/** True when this document runs inside the native shell (`window.FlutterChannel`, or the `FlutterChannel` handler via flutter_inappwebview). */
export function isInShell(): boolean {
    return (
        typeof window !== 'undefined' &&
        (typeof window.FlutterChannel?.postMessage === 'function' ||
            typeof window.flutter_inappwebview?.callHandler === 'function')
    );
}
