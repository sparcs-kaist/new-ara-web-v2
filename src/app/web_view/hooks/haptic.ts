import { getBridge } from '@/app/web_view/_bridge';

/** A selection tick for value changes (steppers, chips, clamps), never for plain taps. */
export function tick() {
    try {
        navigator.vibrate?.(8);
    } catch {
        // Some WebViews throw on vibrate instead of ignoring it; the tick is optional.
    }
    const bridge = getBridge();
    // iOS WebViews have no vibrate; a shell that knows `haptic` plays selectionClick, older ones reply unsupported.
    if (bridge.isNative) bridge.send('haptic', { kind: 'selection' });
}
