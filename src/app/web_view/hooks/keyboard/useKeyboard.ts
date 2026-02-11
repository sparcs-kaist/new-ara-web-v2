import { useAndroidKeyboard } from "./useAndroidKeyboard";
import { useIOSKeyboard } from "./useIOSKeyboard";
import { usePlatform } from "../usePlatform";

export default function useKeyboard() {
    const { isIOS, isAndroid } = usePlatform();

    if (isIOS) return useIOSKeyboard();
    if (isAndroid) return useAndroidKeyboard();

    return { keyboardHeight: 0, isKeyboardOpen: false };
}