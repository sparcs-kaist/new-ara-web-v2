"use client";

import Image from "next/image";

export default function Footer() {
  return (
    <footer className="w-full py-10 bg-white mt-12">
      <div className="max-w-[1280px] mx-auto flex flex-col items-center text-center text-[#c9c9c9] text-sm">
        <div className="flex items-center gap-2 mb-2">
          <Image
            src="/SparcsLogo.svg"
            alt="SPARCS Logo"
            width={84.2}
            height={25}
            style={{
              filter:
              "invert(67%) sepia(0%) saturate(0%) hue-rotate(0deg) brightness(100%) contrast(100%)",
            }}
          />
        </div>
        <div className="flex flex-wrap justify-center items-center gap-2 mb-2 text-base font-normal">
          <span className="cursor-pointer hover:text-ara_red transition">이용약관</span>
          <span className="mx-1 text-gray-300 select-none">|</span>
          <span className="cursor-pointer hover:text-ara_red transition">만든 사람들</span>
          <span className="mx-1 text-gray-300 select-none">|</span>
          <span className="cursor-pointer hover:text-ara_red transition">채팅 문의</span>
        </div>
        <div className="mb-1">
          본 서비스 내의 모든 게시물은 KAIST 학내 구성원만 접근 가능하며, 외부로의 무단 유출 및 전재를 금합니다.
        </div>
        <div className="mb-1">
          기타 문의:{" "}
          <a
            href="mailto:ara@sparcs.org"
            className="underline hover:text-ara_red"
          >
            ara@sparcs.org
          </a>
        </div>
      </div>
    </footer>
  );
}