'use client';

import type { ReactNode } from 'react';
import { Skeleton } from '@/app/web_view/_components';

const CARD = 'h-[99px] rounded-[14px] bg-white px-[11px] py-[6px] shadow-[0_0_0_0.2px_#E6E7EA] drop-shadow-[0_4px_2px_rgba(0,0,0,0.1)]';

export function BoardCard({
    caption,
    title,
    footerLeft,
    footerRight,
    onPress,
}: {
    caption: string | null;
    title: string;
    footerLeft: ReactNode;
    footerRight: ReactNode;
    onPress: () => void;
}) {
    return (
        <button type="button" onClick={onPress} className={`${CARD} flex w-full flex-col text-left`}>
            <span className="block truncate text-[13px] font-medium leading-[16px] tracking-[-0.78px] text-[#808080]">{caption || '\u00A0'}</span>
            <span className="mt-[6px] block truncate text-[19px] font-bold leading-[23px] text-black">{title}</span>
            <span className="mt-[3px] block h-px bg-[#E6E7EA]" />
            <span className="mt-[14px] flex items-center justify-between gap-2 text-[14px] font-medium leading-[17px] tracking-[-0.42px] text-[#808080]">
                <span className="min-w-0 truncate">{footerLeft}</span>
                <span className="shrink-0">{footerRight}</span>
            </span>
        </button>
    );
}

export function BoardCardSkeleton() {
    return (
        <div className={CARD}>
            <Skeleton className="h-[16px] w-[50%] rounded" />
            <Skeleton className="mt-[6px] h-[23px] w-[80%] rounded" />
            <div className="mt-[3px] h-px bg-[#E6E7EA]" />
            <div className="mt-[14px] flex items-center justify-between">
                <Skeleton className="h-[17px] w-[60px] rounded" />
                <Skeleton className="h-[17px] w-[36px] rounded" />
            </div>
        </div>
    );
}
