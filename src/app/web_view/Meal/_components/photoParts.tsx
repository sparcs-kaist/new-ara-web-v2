'use client';

import Image from 'next/image';
import type { ReactNode } from 'react';
import { ImageBadgeIcon } from '@/app/web_view/_components';
import { MEAL_SLOTS, type MealPhoto, type MealSlot } from '@/lib/types/meal';

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
    return <Image src={photo.image} alt={photo.comment || `${photo.restaurant.name} 메뉴 사진`} fill sizes={sizes} className="object-cover" />;
}

export function ChoicePill({
    selected,
    onClick,
    className = 'px-3',
    children,
}: {
    selected: boolean;
    onClick: () => void;
    className?: string;
    children: ReactNode;
}) {
    return (
        <button
            type="button"
            aria-pressed={selected}
            onClick={onClick}
            className={`h-7 shrink-0 rounded-full text-[13px] font-semibold ${className} ${selected ? 'bg-ara_red text-white' : 'bg-white text-black outline outline-1 outline-zinc-100'}`}
        >
            {children}
        </button>
    );
}

export function MealSegment({ value, onChange }: { value: string; onChange: (time: MealSlot['time']) => void }) {
    return (
        <div className="flex gap-1.5">
            {MEAL_SLOTS.map(({ time }) => (
                <ChoicePill key={time} selected={time === value} onClick={() => onChange(time)} className="w-[52px]">
                    {time}
                </ChoicePill>
            ))}
        </div>
    );
}
