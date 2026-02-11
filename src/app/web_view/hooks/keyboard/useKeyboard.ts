import { usePlatform } from '../usePlatform';
import { useIOSKeyboard } from './useIOSKeyboard';
import { useAndroidKeyboard } from './useAndroidKeyboard';

export default function useKeyboard() {
    const { isIOS, isAndroid } = usePlatform();

    const iosKeyboard = useIOSKeyboard();
    const androidKeyboard = useAndroidKeyboard();

    if (isIOS) {
        return iosKeyboard;
    }

    if (isAndroid) {
        return androidKeyboard;
    }

    return {
        keyboardHeight: 0,
        isKeyboardOpen: false,
    };
}