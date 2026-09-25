'use client';

import { useEffect } from 'react';

/** 방 개설 제한 notice, in the UpdatePrompt card style. */
export function PenaltyDialog({ message, onConfirm }: { message: string; onConfirm: () => void }) {
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onConfirm();
        };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [onConfirm]);

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 px-8">
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="ara-delivery-penalty-title"
                className="w-full max-w-[320px] rounded-[20px] bg-white p-6"
            >
                <h2 id="ara-delivery-penalty-title" className="text-[18px] font-semibold text-black">
                    지금은 방을 만들 수 없어요
                </h2>
                <p className="mt-2 break-keep text-[14px] leading-5 text-[#646464]">{message}</p>
                <button
                    type="button"
                    data-press="strong"
                    onClick={onConfirm}
                    className="mt-6 h-[44px] w-full rounded-[10px] bg-ara_red text-[15px] font-medium text-white"
                >
                    확인
                </button>
            </div>
        </div>
    );
}
