'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { getBridge, useBridgeEvent, useIsNative, type CommandRes } from '../_bridge';
import { useMe } from '../_query';
import { updateFCMToken } from '@/lib/api/user';
import { NotificationPermissionPrompt } from './NotificationPermissionPrompt';

export function PushTokenRegistrar() {
    const { data: me } = useMe();
    const isNative = useIsNative();
    const userId = me?.user ?? me?.id;
    const registeredFor = useRef<unknown>(null);
    const running = useRef(false);
    const [needsSettings, setNeedsSettings] = useState(false);

    const run = useCallback(async () => {
        if (running.current) return;
        running.current = true;
        try {
            const bridge = getBridge();
            let supported = true;
            let status: CommandRes<'getPermissionStatus'> | undefined;
            try {
                status = await bridge.request('getPermissionStatus', { kind: 'notification' });
            } catch {
                // Shells before 1.2.5 answer 'unsupported'; they must never see the card.
                supported = false;
            }
            if (!status?.granted) {
                try {
                    // The system dialog waits on the user; the default 15s timeout would drop a slow answer.
                    status = await bridge.request('requestPermission', { kind: 'notification' }, 5 * 60_000);
                } catch {
                    // A timeout or failure counts as not granted.
                }
            }
            if (status?.granted) {
                setNeedsSettings(false);
                const { token } = await bridge.request('getPushToken');
                if (token) await updateFCMToken(token, false);
                return;
            }
            if (supported) setNeedsSettings(true);
        } catch (e) {
            console.warn('[push] token registration skipped', e);
        } finally {
            running.current = false;
        }
    }, []);

    useEffect(() => {
        if (userId == null || isNative !== true || registeredFor.current === userId) return;
        registeredFor.current = userId;
        run();
    }, [userId, isNative, run]);

    // Returning from the OS settings page with the permission on registers right away and hides the card.
    useEffect(() => {
        if (!needsSettings) return;
        const onVisibility = () => {
            if (document.visibilityState === 'visible') run();
        };
        document.addEventListener('visibilitychange', onVisibility);
        return () => document.removeEventListener('visibilitychange', onVisibility);
    }, [needsSettings, run]);

    useBridgeEvent('push:token', (p) => {
        if (userId == null) return;
        updateFCMToken(p.token, false).catch((e) => console.warn('[push] token update failed', e));
    });

    if (!needsSettings) return null;

    return (
        <NotificationPermissionPrompt
            onLater={() => setNeedsSettings(false)}
            onOpenSettings={() => {
                getBridge()
                    .request('openAppSettings')
                    .catch(() => {});
            }}
        />
    );
}
