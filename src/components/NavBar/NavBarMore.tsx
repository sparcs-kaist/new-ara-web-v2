"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import NavBarProfile from "@/components/NavBar/NavBarProfile";
import { logout } from "@/lib/api/user";
import { useMe } from "@/lib/query/user";

export default function NavBarMore({ onClose }: { onClose: () => void }) {
  const [userId, setUserId] = useState<number | string>("");
  const { data: user_data } = useMe();

  useEffect(() => {
    const fetchUser = async () => {
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
    window.location.href = "/login"; // 로그아웃 후 로그인 페이지로 이동 @Todo : 원래 SSO_logout API가 잘 안되는 것 같은데 확인하기
  };

  return (
    <div className="w-screen bg-white absolute top-[77px] left-0 shadow-md">
      <ul
        className="py-4 space-y-[14px]"
        style={{ paddingLeft: "clamp(20px, 5vw, 150px)" }}
      >
        {/* 전체보기 */}
        <li>
          <Link
            href="/board/"
            className="block px-4 py-2 rounded-md text-lg font-medium"
            onClick={onClose}
          >
            🔍 전체보기
          </Link>
        </li>
        {/* 자유게시판 */}
        <li>
          <Link
            href="/board?board=talk"
            className="block px-4 py-2 rounded-md text-lg font-medium"
            onClick={onClose}
          >
            📝 자유게시판
          </Link>
        </li>
        {/* 거래 */}
        <li>
          <button
            className="w-full text-left px-4 py-2 text-lg font-medium"
            onClick={() => toggleMenu("trade")}
          >
            🛒 거래
          </button>
          {openMenus.trade && (
            <ul className="space-y-1 p-2">
              <li>
                <Link
                  href="/board?board=market"
                  className="block px-4 py-2 text-md font-medium "
                  onClick={onClose}
                >
                  장터
                </Link>
              </li>
              <li>
                <Link
                  href="/board?board=wanted"
                  className="block px-4 py-2 text-md font-medium "
                  onClick={onClose}
                >
                  구인구직
                </Link>
              </li>
              <li>
                <Link
                  href="/board?board=real-estate"
                  className="block px-4 py-2 text-md font-medium "
                  onClick={onClose}
                >
                  부동산
                </Link>
              </li>
            </ul>
          )}
        </li>

        {/* 소통 */}
        <li>
          <button
            className="w-full text-left px-4 py-2 text-lg font-medium"
            onClick={() => toggleMenu("communication")}
          >
            📡 소통
          </button>
          {openMenus.communication && (
            <ul className="space-y-1 p-2">
              <li>
                <Link
                  href="/board?board=with-school"
                  className="block px-4 py-2 text-md font-medium"
                  onClick={onClose}
                >
                  학교에게 전합니다
                </Link>
              </li>
              <li>
                <Link
                  href="/board?board=ara-notice"
                  className="block px-4 py-2 text-md font-medium"
                  onClick={onClose}
                >
                  운영진 공지
                </Link>
              </li>
              <li>
                <Link
                  href="/board?board=ara-feedback"
                  className="block px-4 py-2 text-md font-medium"
                  onClick={onClose}
                >
                  아라 피드백
                </Link>
              </li>
              <li>
                <Link
                  href="/board?board=facility-feedback"
                  className="block px-4 py-2 text-md font-medium"
                  onClick={onClose}
                >
                  입주 업체 피드백
                </Link>
              </li>
            </ul>
          )}
        </li>
        {/* 채팅 */}
        <li>
          <Link
            href="/chat"
            className="block px-4 py-2 text-lg font-medium"
            onClick={onClose}
          >
            💬 채팅
          </Link>
        </li>
        {/* 포스터 */}
        <li>
          <Link
            href="/board/?board=poster"
            className="block px-4 py-2 text-lg font-medium"
            onClick={onClose}
          >
            📢 포스터
          </Link>
        </li>
        {/*프로필*/}
        <div className="w-full px-4 py-2" onClick={onClose}>
          <NavBarProfile />
        </div>

        {/*로그아웃*/}
        <li>
          <button
            className="w-full text-left px-4 py-2"
            onClick={() => LogoutHandler(userId)}
          >
            로그아웃
          </button>
        </li>
      </ul>
    </div>
  );
}
