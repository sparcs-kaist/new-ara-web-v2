'use client';

import { AppHeader, InformationIcon, Screen } from '@/app/web_view/_components';

/**
 * Reached when an inactive / deleted account hits the app. Mirrors the
 * Flutter inquiry page: simple stacked text + a single brand-red CTA.
 */
export default function InquiryPage() {
    const onMail = () => {
        if (typeof window !== 'undefined') {
            window.location.href = 'mailto:new-ara@sparcs.org';
        }
    };

    return (
        <Screen withTabBar={false}>
            <AppHeader title="문의" />
            <div className="flex min-h-[calc(100dvh-56px)] flex-col items-center justify-center gap-5 px-6 text-center">
                <span className="text-[#B1B1B1]">
                    <InformationIcon size={50} />
                </span>
                <p className="m-0 max-w-[320px] text-[14px] leading-[1.7] text-[#646464]">
                    탈퇴된 계정입니다. 자세한 내용은
                    <br />
                    new-ara@sparcs.org 로 문의해 주세요.
                </p>
                <button
                    type="button"
                    onClick={onMail}
                    className="h-[44px] rounded-[10px] bg-ara_red px-6 text-[14px] font-bold text-white"
                >
                    메일 보내기
                </button>
            </div>
        </Screen>
    );
}
