'use client';

import { InformationIcon, Screen } from '@/app/web_view/_components';

/**
 * Generic web-view error fallback. No shadow, no chrome — just a centered
 * info icon, a short message, and a brand-red retry button.
 */
export default function ErrorPage() {
    const onRetry = () => {
        if (typeof window !== 'undefined') window.location.reload();
    };

    return (
        <Screen withTabBar={false}>
            <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-4 px-6 text-center">
                <span className="text-[#B1B1B1]">
                    <InformationIcon size={50} />
                </span>
                <h1 className="m-0 text-[18px] font-bold text-black">오류가 발생했어요.</h1>
                <p className="m-0 text-[14px] text-[#B1B1B1]">잠시 후 다시 시도해 주세요.</p>
                <button
                    type="button"
                    onClick={onRetry}
                    className="h-[44px] rounded-[10px] bg-ara_red px-6 text-[14px] font-bold text-white"
                >
                    다시 시도
                </button>
            </div>
        </Screen>
    );
}
