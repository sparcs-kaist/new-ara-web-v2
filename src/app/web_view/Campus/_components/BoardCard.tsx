'use client';

import type { ReactNode } from 'react';
import { Skeleton } from '@/app/web_view/_components';

// Course and major cards share this shell; sizes are deliberately smaller than Figma.
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
        <button type="button" onClick={onPress} className="block w-full rounded-[15px] border border-[#F0F0F0] bg-white p-[14px] text-left">
            <span className="block truncate text-[11px] font-medium leading-[14px] text-[#808080]">{caption || ' '}</span>
            <span className="mt-[2px] line-clamp-2 min-h-[44px] break-keep text-[15px] font-bold leading-[22px] text-[#222222]">{title}</span>
            <span className="mt-[10px] block h-px bg-[#F0F0F0]" />
            <span className="mt-[10px] flex items-center justify-between gap-2">
                <span className="shrink-0 text-[12px] text-[#646464]">{footerLeft}</span>
                <span className="min-w-0 truncate text-[13px] font-medium text-[#222222]">{footerRight}</span>
            </span>
        </button>
    );
}

export function BoardCardSkeleton() {
    return (
        <div className="rounded-[15px] border border-[#F0F0F0] p-[14px]">
            <Skeleton className="h-[14px] w-[50%] rounded" />
            <Skeleton className="mt-[6px] h-[18px] w-[80%] rounded" />
            <Skeleton className="mt-[6px] h-[18px] w-[40%] rounded" />
            <div className="mt-[10px] h-px bg-[#F0F0F0]" />
            <div className="mt-[10px] flex items-center justify-between">
                <Skeleton className="h-[14px] w-[36px] rounded" />
                <Skeleton className="h-[14px] w-[44px] rounded" />
            </div>
        </div>
    );
}
