'use client';

import { ClockIcon } from '@/app/web_view/_components';
import type { StoreOpenState } from '@/lib/types/store';

type Variant = 'list' | 'full';

interface Status {
    text: string;
    className: string;
    icon?: string;
}

const monthDay = (date: string) => date.split('-').slice(1).map(Number).join('/');

export function storeStatus(state: StoreOpenState, variant: Variant): Status {
    const full = variant === 'full';
    const withLabel = (label: string, detail: string) => (full ? [label, detail].filter(Boolean).join(' · ') : detail || label);
    switch (state.kind) {
        case 'OPEN':
        case 'TEMP_OPEN':
            return {
                text: withLabel(state.kind === 'OPEN' ? '영업 중' : '임시 영업', state.time ? `${state.time}까지` : ''),
                className: 'font-bold text-[#646464]',
                icon: 'text-[#888888]',
            };
        case 'BEFORE_OPEN':
            return { text: withLabel('영업 전', state.time ? `${state.time} 오픈` : ''), className: 'font-medium text-[#999999]', icon: 'text-[#BBBBBB]' };
        case 'CLOSED_TODAY':
            return { text: '오늘 휴무', className: 'font-medium text-[#BBBBBB]' };
        case 'CLOSED':
            return { text: '영업 종료', className: 'font-medium text-[#BBBBBB]' };
        case 'TEMP_CLOSED':
            return {
                text: `임시 휴무${state.reason ? ` · ${state.reason}` : ''}${state.until ? ` (${monthDay(state.until)}까지)` : ''}`,
                className: 'font-medium text-ara_red',
            };
    }
}

export function StoreStatusLine({ store, variant, className = '' }: { store: { open_state: StoreOpenState }; variant: Variant; className?: string }) {
    if (!store.open_state) return null;
    const status = storeStatus(store.open_state, variant);
    return (
        <span className={`flex items-center gap-1 text-[12px] ${status.className} ${className}`}>
            {status.icon && <ClockIcon size={16} className={status.icon} />}
            {status.text}
        </span>
    );
}
