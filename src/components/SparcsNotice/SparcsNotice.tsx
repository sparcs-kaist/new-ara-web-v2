"use client";

import Image from "next/image";
import Link from "next/link";

const SparcsNotice = () => {
    return (
        <section className="w-full p-4 bg-white rounded-[16px] shadow border border-gray-200 main-page-block-shadow">
            <div className="flex items-center justify-between mb-3">
                <h2 className="text-[20px] font-bold">📢 SPARCS 공지</h2>
                <Link
                    href="https://www.instagram.com/sparcs.kaist/"
                    target="_blank"
                    className="text-sm text-red-500 hover:underline"
                >
                    더보기
                </Link>
            </div>
            <div className="relative w-full h-[200px] overflow-hidden rounded-md">
                <Image
                    src="/sparcs-notice.png"
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
