/* eslint-disable react-hooks/exhaustive-deps */
'use client';

import { useEffect, useRef, useState } from 'react';
import { getBridge } from './client';
import type { EventPayload, EventType } from './types';

/**
 * Subscribe to a native event for the lifetime of a component.
 *
 *   useBridgeEvent('back:pressed', () => router.back())
 */
export function useBridgeEvent<T extends EventType>(type: T, handler: (payload: EventPayload<T>) => void): void {
    const ref = useRef(handler);
    ref.current = handler;
    useEffect(() => {
        const bridge = getBridge();
        return bridge.on(type, (p) => ref.current(p));
    }, [type]);
}

/** Returns true once the native bridge has greeted us; null while pending. */
export function useIsNative(): boolean | null {
    const [isNative, setIsNative] = useState<boolean | null>(null);
    useEffect(() => {
        let cancelled = false;
        getBridge()
            .ready()
            .then((cap) => {
                if (!cancelled) setIsNative(!!cap);
            });
        return () => {
            cancelled = true;
        };
    }, []);
    return isNative;
}
