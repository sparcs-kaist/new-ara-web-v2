'use client';

import { useCallback, useRef } from 'react';
import { useBridgeEvent, getBridge } from '@/app/web_view/_bridge';
import { useInvalidateAll } from '@/app/web_view/_query';

/**
 * Hooks the page into the native shell's `PullToRefreshController`. The
 * Flutter side fires `refresh:requested` when the user drags past the
 * threshold; we invalidate the WebView cache so every active query
 * refetches, then call `refreshDone` to dismiss the native spinner.
 *
 * Each page that opts in should call this from its top-level component
 * — Main, Board, Notifications, etc. The native shell scopes its
 * spinner to the current WebView, so the call only fires for the
 * visible page.
 */
export function usePullToRefresh(onRefresh?: () => Promise<unknown> | unknown) {
    const invalidateAll = useInvalidateAll();
    const inFlight = useRef(false);

    const handler = useCallback(async () => {
        if (inFlight.current) return;
        inFlight.current = true;
        try {
            if (onRefresh) {
                await onRefresh();
            } else {
                await invalidateAll();
            }
        } catch (e) {
            console.warn('pull-to-refresh failed', e);
        } finally {
            inFlight.current = false;
            // Tell the native shell to dismiss its spinner. Best-effort —
            // if the bridge isn't connected (running in a regular browser
            // for dev), `send` is a no-op.
            getBridge().send('refreshDone');
        }
    }, [invalidateAll, onRefresh]);

    useBridgeEvent('refresh:requested', handler);
}
