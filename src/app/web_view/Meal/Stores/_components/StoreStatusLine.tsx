'use client';

import type { StoreSummary } from '@/lib/types/store';

type StoreStatus = Pick<StoreSummary, 'is_open' | 'open_note'>;

// Green = you can go now, grey = closed as usual, red = closed unusually.
export function storeStatus({ is_open, open_note }: StoreStatus): { text: string; className: string } {
    if (is_open) return { text: open_note ?? '영업 중', className: 'text-[#2E9E55]' };
    if (open_note?.startsWith('임시 휴무')) return { text: open_note, className: 'text-ara_red' };
    return { text: open_note ?? '영업 종료', className: 'text-[#888888]' };
}

export function StoreStatusLine({ store, className = 'text-[12px]' }: { store: StoreStatus; className?: string }) {
    const status = storeStatus(store);
    return <span className={`block font-bold ${status.className} ${className}`}>{status.text}</span>;
}
