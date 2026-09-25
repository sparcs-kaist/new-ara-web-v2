'use client';

import Image from 'next/image';
import type { ReactNode } from 'react';
import { ImageBadgeIcon } from '@/app/web_view/_components';
import type { MealPhoto } from '@/lib/types/meal';

/** Dark pill on a photo's top-left corner: the restaurant on the home strip, 자동 수집 in the grid. */
export function PhotoLabel({ children }: { children: ReactNode }) {
    return (
        <span className="absolute left-2 top-2 rounded-[6px] bg-black/55 px-[6px] py-[2px] text-[11px] font-semibold leading-[15px] text-white">
            {children}
        </span>
    );
}

export function OfficialBadge({ className }: { className: string }) {
    return (
        <span className={`absolute rounded-[6px] bg-ara_red px-[6px] py-[2px] text-[11px] font-semibold leading-[15px] text-white ${className}`}>
            공식
        </span>
    );
}

/** Fills a relative, overflow-hidden box with the photo, or the grey 사진 없음 tile. */
export function PhotoCover({ photo, sizes }: { photo?: MealPhoto; sizes: string }) {
    if (!photo) {
        return (
            <span className="flex h-full w-full flex-col items-center justify-center gap-1 bg-[#F6F6F6] text-[#BBBBBB]">
                <ImageBadgeIcon size={32} />
                <span className="text-[12px]">사진 없음</span>
            </span>
        );
    }
    return <Image src={photo.image} alt={photo.comment || `${photo.restaurant.name} 메뉴 사진`} fill sizes={sizes} className="object-cover" />;
}
