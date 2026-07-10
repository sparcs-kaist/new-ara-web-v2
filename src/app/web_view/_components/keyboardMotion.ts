import type { KeyboardMotionOptions } from '@sparcs-kaist/keyboard-inset';

/** One keyboard clock for the shell — every keyboard-aware hook must receive
 *  THIS object, or the composer and scroll position drift apart. */
export const KEYBOARD_MOTION = {
    motion: 'animated',
    host: 'flutter',
} as const satisfies KeyboardMotionOptions;
