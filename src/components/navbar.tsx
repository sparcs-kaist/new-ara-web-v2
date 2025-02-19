"use client";

import { useState } from "react";
import Link from "next/link";

export default function Navbar() {
  const [isAlarmShow, setIsAlarmShow] = useState(false);

  const toggleAlarm = () => {
    setIsAlarmShow(!isAlarmShow);
  };

  return (
    <nav className="flex w-full mx-auto items-center justify-between h- 77 p-7">
      {/* 로고 */}
      <div className="flex items-center ml-[150px]">
        <Link href="/" className="text-xl font-bold">
          <img src="/ServiceAra.png" className="h-8 w-auto" alt="Service Ara Logo" />
        </Link>
      </div>

      {/* 메뉴 */}
      <div className="flex flex-row space-x-12">
      <Link href="/board" className="px-3 py-2">
          전체보기
        </Link>
        <Link href="/board/top" className="px-3 py-2">
          인기글 게시판
        </Link>
        <Link href="/board/talk" className="px-3 py-2">
          자유게시판
        </Link>
        <div className="px-3 py-2">학생단체 및 동아리</div>
        <div className="px-3 py-2">거래</div>
        <div className="px-3 py-2">소통</div>
      </div>

      {/* 우측 버튼 */}
      <div className="flex items-center space-x-4">
        {/* 알림 버튼 */}
        <div className="relative flex items-center space-x-4">
          <button className="relative">
            <img src="/language.png" className="w-5 h-5" />
          </button>
          <button onClick={toggleAlarm} className="relative">
            <img src="/notification.png" className="w-auto h-5" />
          </button>
          {isAlarmShow && (
            <div className="absolute right-0 mt-2 w-48 bg-white shadow-lg rounded p-2">
              <div className="text-center text-sm text-gray-700">알림이 없습니다.</div>
              <Link href="/notifications" className="block text-center text-blue-500 mt-2">
                알림 더 보기
              </Link>
            </div>
          )}
        </div>

        {/* 사용자 프로필 */}
        <div className="relative">
          <Link href="/my-info" className="flex items-center">
            <img src="/user.png" className="w-8 h-8 rounded-full" alt="User" />
            <span className="ml-2 text-gray-700">사용자 이름</span>
          </Link>
        </div>
      </div>
    </nav>
  );
}
