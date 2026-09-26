'use client';

import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchMyStores, fetchStore, fetchStoreEvents, fetchStores } from '@/lib/api/store';
import { useMe } from './hooks';

export const STORES_KEY = ['webview', 'stores'] as const;
export const storeKey = (id: number) => [...STORES_KEY, 'store', id] as const;
export const storeEventsKey = (id: number) => [...STORES_KEY, 'events', id] as const;
export const MY_STORES_KEY = [...STORES_KEY, 'mine'] as const;

export function useStores() {
    return useQuery({
        queryKey: [...STORES_KEY, 'list'],
        queryFn: () => fetchStores(),
        staleTime: 5 * 60_000,
    });
}

export function useStore(id: number) {
    return useQuery({
        queryKey: storeKey(id),
        queryFn: () => fetchStore(id),
        enabled: Number.isFinite(id) && id > 0,
        retry: false,
    });
}

export function useStoreEvents(id: number, enabled = true) {
    return useQuery({
        queryKey: storeEventsKey(id),
        queryFn: () => fetchStoreEvents(id),
        enabled: enabled && Number.isFinite(id) && id > 0,
        retry: false,
    });
}

export function useMyStores() {
    const me = useMe();
    return useQuery({
        queryKey: MY_STORES_KEY,
        queryFn: fetchMyStores,
        select: (data) => data.store_ids,
        enabled: !!me.data,
        staleTime: 30 * 60_000,
        retry: false,
    });
}

export function useInvalidateStores() {
    const qc = useQueryClient();
    return useCallback(() => qc.invalidateQueries({ queryKey: STORES_KEY }), [qc]);
}
