import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";

import { fetchMe, logout } from "@/lib/api/user";

const DEFAULT_PROFILE = "/user.png";

export default function NavBarProfile() {
  const [User, setUser] = useState("");
  const [userId, setUserId] = useState<number | string>("");
  const [picture, setPicture] = useState("");
  const [open, setOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const user_data = await fetchMe();
      setUser(user_data.nickname);
      setPicture(user_data.picture);
      setUserId(user_data.user_id);
    };
    fetchUser();
  }, []);

  // 팝오버 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await logout(userId);
      window.location.href = "/login";
    } catch (error) {
      console.error("로그아웃 실패:", error);
    }
  };

  return (
    <div className="relative" ref={popoverRef}>
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center space-x-[10px] cursor-pointer"
      >
        <div className="relative w-6 h-6">
          <Image
            src={picture || DEFAULT_PROFILE}
            alt="user profile image"
            fill
            className="rounded-full object-cover"
            sizes="24px"
          />
        </div>
        <p>{User}</p>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-36 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
          <Link
            href="/myinfo"
            className="block px-4 py-2 text-sm text-gray-700 font-semibold hover:bg-gray-100"
            onClick={() => setOpen(false)}
          >
            프로필
          </Link>
          <button
            onClick={handleLogout}
            className="block w-full text-left px-4 py-2 text-sm font-semibold text-red-500 hover:bg-gray-100"
          >
            로그아웃
          </button>
        </div>
      )}
    </div>
  );
}