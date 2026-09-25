'use client';

import { keepPreviousData, useInfiniteQuery, useQuery } from '@tanstack/react-query';
import {
    fetchDeliveryParties,
    fetchDeliveryParty,
    fetchDeliveryPenalty,
    type DeliveryListParams,
} from '@/lib/api/delivery';
import { ordersAllowed } from '@/lib/delivery';

/** Prefix of every delivery query; invalidate it after any delivery mutation. */
export const DELIVERY_KEY = ['webview', 'delivery'] as const;

// Rooms fill up and close by the minute, so these refetch on mount (the client default is refetchOnMount: false).
export function useDeliveryParties(params: Omit<DeliveryListParams, 'page'>) {
    return useInfiniteQuery({
        queryKey: [...DELIVERY_KEY, 'list', params],
        queryFn: ({ pageParam }) => fetchDeliveryParties({ ...params, page: pageParam }),
        initialPageParam: 1,
        getNextPageParam: (last, all) => (last.next ? all.length + 1 : undefined),
        placeholderData: keepPreviousData,
        staleTime: 15_000,
        refetchOnMount: true,
    });
}

export function useDeliveryParty(id: number | null, { poll = false } = {}) {
    return useQuery({
        queryKey: [...DELIVERY_KEY, 'party', id],
        queryFn: () => fetchDeliveryParty(id as number),
        enabled: id !== null,
        staleTime: 5_000,
        refetchOnMount: true,
        // Backs up the socket in the room: the deadline sweep lands up to a minute late.
        refetchInterval: (q) => (poll && q.state.data && ordersAllowed(q.state.data) ? 30_000 : false),
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
