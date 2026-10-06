import { getBridge } from '@/app/web_view/_bridge';

export function tick() {
    try {
        navigator.vibrate?.(8);
    } catch {
        // Some WebViews throw on vibrate instead of ignoring it.
    }
    const bridge = getBridge();
    // iOS has no vibrate; shells without the haptic handler reply unsupported.
    if (bridge.isNative) bridge.send('haptic', { kind: 'selection' });
}
