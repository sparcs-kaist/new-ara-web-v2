'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { useQueryClient } from '@tanstack/react-query';
import { Close2Icon, ConfirmDialog, LeftChevronIcon, RightChevronIcon } from '@/app/web_view/_components';
import { MEAL_PHOTOS_KEY } from '@/app/web_view/_query';
import { apiDetail } from '@/lib/api/delivery';
import { deleteMealPhoto } from '@/lib/api/meal';
import { pad } from '@/lib/delivery';
import type { MealPhoto } from '@/lib/types/meal';

export interface ViewerState {
    photos: MealPhoto[];
    index: number;
}

export function PhotoViewer({ state, onChange }: { state: ViewerState; onChange: (next: ViewerState | null) => void }) {
    const qc = useQueryClient();
    const [confirming, setConfirming] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { photos, index } = state;
    const photo = photos[index];

    // The dialog handles Escape (hardware back) itself while it is up.
    useEffect(() => {
        if (confirming) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onChange(null);
        };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [confirming, onChange]);

    const go = (i: number) => {
        setError(null);
        onChange({ photos, index: i });
    };

    const remove = async () => {
        setDeleting(true);
        try {
            await deleteMealPhoto(photo.id);
            qc.invalidateQueries({ queryKey: MEAL_PHOTOS_KEY });
            onChange(null);
        } catch (e) {
            setError(apiDetail(e));
            setConfirming(false);
            setDeleting(false);
        }
    };

    const posted = new Date(photo.created_at);
    const by = photo.source === 'INSTAGRAM' ? '인스타그램에서 자동 수집' : photo.is_official ? '입주 업체가 등록' : photo.author?.nickname;

    return createPortal(
        <div
            role="dialog"
            aria-modal="true"
            aria-label="메뉴 사진"
            className="fixed inset-0 z-[75] flex flex-col bg-black text-white"
            style={{ paddingTop: 'var(--ara-safe-top)', paddingBottom: 'var(--ara-safe-bottom)' }}
        >
            <div className="flex h-14 shrink-0 items-center px-2">
                <button type="button" aria-label="닫기" onClick={() => onChange(null)} className="flex h-11 w-11 items-center justify-center">
                    <Close2Icon size={22} />
                </button>
                <span className="flex-1 text-center text-[15px] font-semibold">
                    {photo.restaurant.name} <span className="font-normal text-white/60">{index + 1}/{photos.length}</span>
                </span>
                {photo.is_mine ? (
                    <button type="button" onClick={() => setConfirming(true)} className="h-11 min-w-[44px] px-2 text-[15px] font-medium">
                        삭제
                    </button>
                ) : (
                    <span className="w-11" />
                )}
            </div>

            <div className="relative min-h-0 flex-1">
                <Image src={photo.image} alt={photo.comment || `${photo.restaurant.name} 메뉴 사진`} fill sizes="100vw" className="object-contain" />
                {index > 0 && (
                    <button
                        type="button"
                        aria-label="이전 사진"
                        onClick={() => go(index - 1)}
                        className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/40"
                    >
                        <LeftChevronIcon size={24} />
                    </button>
                )}
                {index < photos.length - 1 && (
                    <button
                        type="button"
                        aria-label="다음 사진"
                        onClick={() => go(index + 1)}
                        className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/40"
                    >
                        <RightChevronIcon size={24} />
                    </button>
                )}
            </div>

            <div className="shrink-0 px-5 pb-6 pt-4">
                {photo.comment && <p className="break-keep text-[15px] leading-[1.5]">{photo.comment}</p>}
                <p className="mt-1 text-[13px] text-white/60">
                    {by} · {pad(posted.getHours())}:{pad(posted.getMinutes())}
                </p>
                {error && <p className="mt-2 text-[13px] text-ara_red">{error}</p>}
            </div>

            {confirming && (
                <ConfirmDialog
                    title="사진을 삭제할까요?"
                    secondary={{ label: '취소', onClick: () => setConfirming(false) }}
                    primary={{ label: '삭제', onClick: remove, disabled: deleting }}
                    onClose={() => setConfirming(false)}
                />
            )}
        </div>,
        document.body,
    );
}
