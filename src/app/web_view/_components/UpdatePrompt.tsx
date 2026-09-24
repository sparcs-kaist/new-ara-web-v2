'use client';

import { useEffect, useState } from 'react';
import { getBridge, type Platform } from '../_bridge';
import { MIN_APP_VERSION, STORE_URL, isBelow } from './appVersion';

const SNOOZE_KEY = 'ara:update-snooze-until';
const SNOOZE_MS = 24 * 60 * 60 * 1000;

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
                try {
                    if (Date.now() < Number(window.localStorage.getItem(SNOOZE_KEY))) return;
                } catch { /* blocked storage */ }
                setPlatform(cap.platform);
            });
        return () => {
            cancelled = true;
        };
    }, []);

    if (!platform) return null;

    const close = (update: boolean) => {
        try {
            window.localStorage.setItem(SNOOZE_KEY, String(Date.now() + SNOOZE_MS));
        } catch { /* blocked storage */ }
        if (update) getBridge().send('openExternal', { url: STORE_URL[platform] });
        setPlatform(null);
    };

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
                <p className="mt-2 text-[14px] leading-5 text-[#646464]">
                    더 나은 사용을 위해 최신 버전으로 업데이트해 주세요.
                </p>
                <div className="mt-6 flex gap-2">
                    <button
                        type="button"
                        onClick={() => close(false)}
                        className="h-[44px] flex-1 rounded-[10px] bg-[#F6F6F6] text-[15px] font-medium text-[#646464]"
                    >
                        나중에
                    </button>
                    <button
                        type="button"
                        data-press="strong"
                        onClick={() => close(true)}
                        className="h-[44px] flex-1 rounded-[10px] bg-ara_red text-[15px] font-medium text-white"
                    >
                        업데이트
                    </button>
                </div>
            </div>
        </div>
    );
}
