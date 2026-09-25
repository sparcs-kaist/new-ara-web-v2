'use client';

import { keepPreviousData, useInfiniteQuery, useQuery } from '@tanstack/react-query';
import {
    fetchDeliveryParties,
    fetchDeliveryParty,
    fetchDeliveryPenalty,
    type DeliveryListParams,
} from '@/lib/api/delivery';

/** Prefix of every delivery query; invalidate it after any delivery mutation. */
export const DELIVERY_KEY = ['webview', 'delivery'] as const;

// Rooms fill up and close by the minute, so these refetch on mount once stale
// (the client default is refetchOnMount: false).

export function useDeliveryParties(params: Omit<DeliveryListParams, 'page'>, opts?: { enabled?: boolean }) {
    return useInfiniteQuery({
        queryKey: [...DELIVERY_KEY, 'list', params],
        queryFn: ({ pageParam }) => fetchDeliveryParties({ ...params, page: pageParam }),
        initialPageParam: 1,
        getNextPageParam: (last, all) => (last.next ? all.length + 1 : undefined),
        placeholderData: keepPreviousData,
        staleTime: 15_000,
        refetchOnMount: true,
        enabled: opts?.enabled,
    });
}

export function useDeliveryParty(id: number | null) {
    return useQuery({
        queryKey: [...DELIVERY_KEY, 'party', id],
        queryFn: () => fetchDeliveryParty(id as number),
        enabled: id !== null,
        staleTime: 5_000,
        refetchOnMount: true,
    });
}

export function useDeliveryPenalty() {
    return useQuery({
        queryKey: [...DELIVERY_KEY, 'penalty'],
        queryFn: fetchDeliveryPenalty,
        staleTime: 60_000,
        refetchOnMount: true,
    });
}
