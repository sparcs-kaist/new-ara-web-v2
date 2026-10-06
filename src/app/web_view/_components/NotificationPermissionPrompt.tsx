'use client';

import { useEffect } from 'react';
import { InformationIcon } from './icons';

export function NotificationPermissionPrompt({
    onLater,
    onOpenSettings,
}: {
    onLater: () => void;
    onOpenSettings: () => void;
}) {
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onLater();
        };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [onLater]);

    // One below UpdatePrompt (z-[70]) so the update card stays on top if both show.
    return (
        <div className="fixed inset-0 z-[69] flex items-center justify-center bg-black/40 px-8">
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="ara-notification-permission-title"
                className="w-full max-w-[320px] rounded-[20px] bg-white p-6"
            >
                <h2 id="ara-notification-permission-title" className="text-[18px] font-semibold text-black">
                    알림을 켜 주세요
                </h2>
                <p className="mt-2 break-keep text-[14px] leading-5 text-[#646464]">
                    새 댓글과 채팅 메시지 알림을 받으려면 알림 권한이 필요해요.
                </p>
                <p className="mt-3 flex items-start gap-1 break-keep text-[12px] leading-4 text-[#999999]">
                    <InformationIcon size={14} className="mt-[1px] shrink-0" />
                    설정에서 알림을 허용하고 돌아오면 바로 이어집니다.
                </p>
                <div className="mt-6 flex gap-2">
                    <button
                        type="button"
                        onClick={onLater}
                        className="h-[44px] flex-1 rounded-[10px] bg-[#F6F6F6] text-[15px] font-medium text-[#646464]"
                    >
                        나중에
                    </button>
                    <button
                        type="button"
                        data-press="strong"
                        onClick={onOpenSettings}
                        className="flex h-[44px] flex-1 items-center justify-center rounded-[10px] bg-ara_red text-[15px] font-medium text-white"
                    >
                        설정 열기
                    </button>
                </div>
            </div>
        </div>
    );
}
