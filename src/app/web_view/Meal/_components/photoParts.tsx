'use client';

import Image from 'next/image';
import type { ReactNode } from 'react';
import { ChoiceChip, ImageBadgeIcon } from '@/app/web_view/_components';
import { MEAL_SLOTS, restaurantName, type MealPhoto, type MealSlot } from '@/lib/types/meal';

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

export function PhotoCover({ photo, sizes }: { photo?: MealPhoto; sizes: string }) {
    if (!photo) {
        return (
            <span className="flex h-full w-full flex-col items-center justify-center gap-1 bg-[#F6F6F6] text-[#BBBBBB]">
                <ImageBadgeIcon size={32} />
                <span className="text-[12px]">사진 없음</span>
            </span>
        );
    }
    return <Image src={photo.image} alt={photo.comment || `${restaurantName(photo.restaurant)} 메뉴 사진`} fill sizes={sizes} className="object-cover" />;
}

export function MealSegment({ value, onChange }: { value: string; onChange: (time: MealSlot['time']) => void }) {
    return (
        <div className="flex gap-1.5">
            {MEAL_SLOTS.map(({ time }) => (
                <ChoiceChip key={time} size="sm" selected={time === value} onClick={() => onChange(time)} className="w-[52px]">
                    {time}
                </ChoiceChip>
            ))}
        </div>
    );
}
