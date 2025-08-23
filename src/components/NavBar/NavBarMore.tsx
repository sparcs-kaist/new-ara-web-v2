"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import NavBarProfile from "@/components/NavBar/NavBarProfile";
import { logout, fetchMe } from '@/lib/api/user'

export default function NavBarMore({ onClose }: { onClose: () => void }) {
  const [userId, setUserId] = useState<number | string>('');

  useEffect(() => {
    const fetchUser = async () => {
      const user_data = await fetchMe();
      setUserId(user_data.user);
    };
    fetchUser();
  }, []);
  const [openMenus, setOpenMenus] = useState<{ [key: string]: boolean }>({
    notice: false,
    clubs: false,
    trade: false,
    communication: false,
  });

  const toggleMenu = (menu: string) => {
    setOpenMenus((prev) => ({
      [menu]: !prev[menu],
    }));
  };

  const LogoutHandler = async (userId: number | string) => {
    await logout(userId);
    window.location.href = '/login'; // 로그아웃 후 로그인 페이지로 이동 @Todo : 원래 SSO_logout API가 잘 안되는 것 같은데 확인하기
  }

  return (
    <div className="w-screen bg-white absolute top-[77px] left-0 shadow-md">
      <ul className="py-4 space-y-[14px]" style={{ paddingLeft: "clamp(20px, 5vw, 150px)" }}>
        {/* 공지 */}
        <li>
          <button
            className="w-full text-left px-4 py-2"
            onClick={() => toggleMenu("notice")}
          >
            공지
          </button>
          {openMenus.notice && (
            <ul className="space-y-1 p-2">
              <li><Link href="/bboard/external-company-advertisement" className="block px-4 py-2 " onClick={onClose}>외부 업체 홍보</Link></li>
              <li><Link href="/board/facility-notice" className="block px-4 py-2 " onClick={onClose}>입주 업체 공지</Link></li>
              <li><Link href="/board/ara-notice" className="block px-4 py-2 " onClick={onClose}>운영진 공지</Link></li>
              <li><Link href="/board/portal-notice" className="block px-4 py-2 " onClick={onClose}>포탈공지</Link></li>
            </ul>
          )}
        </li>

        {/* 자유게시판 */}
        <li>
          <Link href="/board/talk" className="block px-4 py-2 rounded-md" onClick={onClose}>
            자유게시판
          </Link>
        </li>

        {/* 학생 단체 및 동아리 */}
        <li>
          <button
            className="w-full text-left px-4 py-2 rounded-md"
            onClick={() => toggleMenu("clubs")}
          >
            학생 단체 및 동아리
          </button>
          {openMenus.clubs && (
            <ul className="space-y-1 p-2">
              <li><Link href="/board/club" className="block px-4 py-2 " onClick={onClose}>동아리</Link></li>
              <li><Link href="/board/students-group" className="block px-4 py-2 " onClick={onClose}>학생 단체</Link></li>
            </ul>
          )}
        </li>

        {/* 거래 */}
        <li>
          <button
            className="w-full text-left px-4 py-2"
            onClick={() => toggleMenu("trade")}
          >
            거래
          </button>
          {openMenus.trade && (
            <ul className="space-y-1 p-2">
              <li><Link href="/board/real-estate" className="block px-4 py-2 " onClick={onClose}>부동산</Link></li>
              <li><Link href="/board/market" className="block px-4 py-2 " onClick={onClose}>장터</Link></li>
              <li><Link href="/board/wanted" className="block px-4 py-2 " onClick={onClose}>구인구직</Link></li>
            </ul>
          )}
        </li>

        {/* 소통 */}
        <li>
          <button
            className="w-full text-left px-4 py-2"
            onClick={() => toggleMenu("communication")}
          >
            소통
          </button>
          {openMenus.communication && (
            <ul className="space-y-1 p-2">
              <li><Link href="/board/with-school" className="block px-4 py-2 " onClick={onClose}>학교에게 전합니다</Link></li>
              <li><Link href="/board/kaist-news" className="block px-4 py-2 " onClick={onClose}>카이스트 뉴스</Link></li>
              <li><Link href="/board/newara-feedback" className="block px-4 py-2 " onClick={onClose}>아라 피드백</Link></li>
              <li><Link href="/board/facility-feedback" className="block px-4 py-2 " onClick={onClose}>입주 업체 피드백</Link></li>
            </ul>
          )}
        </li>

        {/* 인기글 게시판 */}
        <li>
          <Link href="/board/top" className="block px-4 py-2" onClick={onClose}>
            인기글 게시판
          </Link>
        </li>
        {/*프로필*/}
        <div className="w-full px-4 py-2" onClick={onClose}>
          <NavBarProfile />
        </div>

        {/*로그아웃*/}
        <li >
          <button className="w-full text-left px-4 py-2" onClick={() => LogoutHandler(userId)}>
            로그아웃
          </button>
        </li>

      </ul>
    </div>
  );
}