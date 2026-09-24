'use client';

import { useEffect, useRef } from 'react';
import { getBridge, useBridgeEvent, useIsNative } from '../_bridge';
import { useMe } from '../_query';
import { updateFCMToken } from '@/lib/api/user';

export function PushTokenRegistrar() {
    const { data: me } = useMe();
    const isNative = useIsNative();
    const userId = me?.user ?? me?.id;
    const registeredFor = useRef<unknown>(null);

    useEffect(() => {
        if (userId == null || isNative !== true || registeredFor.current === userId) return;
        registeredFor.current = userId;
        (async () => {
            try {
                const bridge = getBridge();
                // The system dialog waits on the user; the default 15s timeout would drop a slow answer.
                const { granted } = await bridge.request('requestPermission', { kind: 'notification' }, 5 * 60_000);
                if (!granted) return;
                const { token } = await bridge.request('getPushToken');
                if (token) await updateFCMToken(token, false);
            } catch (e) {
                console.warn('[push] token registration skipped', e);
            }
        })();
    }, [userId, isNative]);

    useBridgeEvent('push:token', (p) => {
        if (userId == null) return;
        updateFCMToken(p.token, false).catch((e) => console.warn('[push] token update failed', e));
    });

    return null;
}
