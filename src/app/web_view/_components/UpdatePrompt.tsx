'use client';

import { useEffect, useState } from 'react';
import { getBridge, type Platform } from '../_bridge';
import { MIN_APP_VERSION, STORE_URL, isBelow } from './appVersion';
import { InformationIcon } from './icons';

export function UpdatePrompt() {
    const [platform, setPlatform] = useState<Platform | null>(null);

    useEffect(() => {
        let cancelled = false;
        getBridge()
            .ready()
            .then((cap) => {
                if (cancelled || !cap) return;
                const min = MIN_APP_VERSION[cap.platform];
                if (!min || !isBelow(cap.appVersion, min)) return;
                setPlatform(cap.platform);
            });
        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        if (!platform) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setPlatform(null);
        };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [platform]);

    if (!platform) return null;

    // Shown once per app launch (the layout stays mounted across in-app navigation).
    const close = () => setPlatform(null);

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 px-8">
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="ara-update-title"
                className="w-full max-w-[320px] rounded-[20px] bg-white p-6"
            >
                <h2 id="ara-update-title" className="text-[18px] font-semibold text-black">
                    새 버전이 나왔어요
                </h2>
                <p className="mt-2 break-keep text-[14px] leading-5 text-[#646464]">
                    더 나은 사용을 위해 최신 버전으로 업데이트해 주세요.
                </p>
                <p className="mt-3 flex items-start gap-1 break-keep text-[12px] leading-4 text-[#999999]">
                    <InformationIcon size={14} className="mt-[1px] shrink-0" />
                    업데이트하지 않으면 일부 기능이 동작하지 않을 수 있어요.
                </p>
                <div className="mt-6 flex gap-2">
                    <button
                        type="button"
                        onClick={close}
                        className="h-[44px] flex-1 rounded-[10px] bg-[#F6F6F6] text-[15px] font-medium text-[#646464]"
                    >
                        나중에
                    </button>
                    {/* A real link: the shell hands non-http and off-domain navigations to the OS even without the bridge. */}
                    <a
                        href={STORE_URL[platform]}
                        data-press="strong"
                        onClick={close}
                        className="flex h-[44px] flex-1 items-center justify-center rounded-[10px] bg-ara_red text-[15px] font-medium text-white"
                    >
                        업데이트
                    </a>
                </div>
            </div>
        </div>
    );
}
