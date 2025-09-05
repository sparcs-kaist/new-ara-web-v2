"use client";

import Image from "next/image";
import Link from "next/link";

interface SparcsNoticeProps {
    className?: string;
}

const SparcsNotice = ({ className }: SparcsNoticeProps) => {
    return (
        <section className={`w-full p-4 bg-white rounded-[16px] shadow border border-gray-200 main-page-block-shadow flex flex-col ${className || ''}`}>
            <div className="flex items-center justify-between mb-3">
                <h2 className="text-[20px] font-bold">📢 SPARCS 공지</h2>
                {/* '더보기' 텍스트를 + 아이콘으로 변경 */}
                <Link
                    href="https://www.instagram.com/sparcs.kaist/"
                    target="_blank"
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                    aria-label="SPARCS 인스타그램으로 이동"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                </Link>
            </div>
            {/* 고정 높이를 제거하고 flex-1을 추가하여 남은 공간을 모두 채움 */}
            <div className="relative w-full flex-1 overflow-hidden rounded-md">
                <Image
                    src="/SparcsNotice/커피쿠폰 스토리.png"
                    alt="SPARCS Notice"
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 30vw"
                    priority
                />
            </div>
        </section>
    );
};

export default SparcsNotice;
