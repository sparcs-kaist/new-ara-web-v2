'use client';

import { useEffect, useState } from 'react';

const listeners = new Set<(now: number) => void>();
let timer: number | undefined;

function subscribe(listener: (now: number) => void) {
    listeners.add(listener);
    // One interval for every mounted countdown, so they all tick in the same render.
    if (timer === undefined) {
        timer = window.setInterval(() => {
            const now = Date.now();
            listeners.forEach((l) => l(now));
        }, 1000);
    }
    return () => {
        listeners.delete(listener);
        if (listeners.size === 0) {
            window.clearInterval(timer);
            timer = undefined;
        }
    };
}

/** Current time in ms, re-rendering once a second. */
export function useNow(): number {
    const [now, setNow] = useState(() => Date.now());
    useEffect(() => subscribe(setNow), []);
    return now;
}
