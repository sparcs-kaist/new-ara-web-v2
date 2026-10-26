"use client";

import { useEffect, useState } from "react";
import {
    GLOBAL_BANNER,
    type GlobalBannerContent,
    dismissBanner,
    isBannerActive,
    isBannerDismissed,
} from "@/lib/globalBanner";

interface GlobalBannerProps {
    banner?: GlobalBannerContent;
    className?: string;
    // 웹뷰는 링크를 앱 라우터나 외부 브라우저로 열어야 해서 직접 처리한다.
    onOpenLink?: (link: string) => void;
}

const GlobalBanner = ({ banner = GLOBAL_BANNER, className, onOpenLink }: GlobalBannerProps) => {
    // 기간·닫힘 여부는 클라이언트에서만 알 수 있으므로 마운트 후에 판단한다.
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (!isBannerActive(banner) || isBannerDismissed(banner.id)) return;
        setVisible(true);
        // 페이지를 켜둔 채로 종료 시각이 지나면 내린다.
        const remaining = Date.parse(banner.endAt) - Date.now();
        const timer = window.setTimeout(() => setVisible(false), remaining);
        return () => window.clearTimeout(timer);
    }, [banner]);

    if (!visible) return null;

    const link = banner.link?.trim();
    const message = <span className="flex-1 min-w-0 break-keep">📢 {banner.message}</span>;

    return (
        <div
            role="status"
            className={`flex items-center gap-2 bg-[#ed3a3a] px-4 py-2.5 text-[14px] font-medium text-white ${className || ""}`}
        >
            {link ? (
                <a
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-1 min-w-0 items-center gap-1 hover:underline"
                    onClick={(e) => {
                        if (!onOpenLink) return;
                        e.preventDefault();
                        onOpenLink(link);
                    }}
                >
                    {message}
                    <span aria-hidden className="shrink-0">›</span>
                </a>
            ) : (
                message
            )}
            <button
                type="button"
                aria-label="공지 닫기"
                className="shrink-0 rounded p-1 text-white/80 hover:text-white"
                onClick={() => {
                    dismissBanner(banner.id);
                    setVisible(false);
                }}
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
            </button>
        </div>
    );
};

export default GlobalBanner;
