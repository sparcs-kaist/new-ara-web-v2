import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";

import { fetchMe } from "@/lib/api/user"; // 예시로 추가된 API 호출

const DEFAULT_PROFILE = "/default_profile.png"; // public 폴더에 기본 이미지

export default function NavBarProfile() {
  const [User, setUser] = useState("");
  const [picture, setPicture] = useState("");

  useEffect(() => {
    const fetchUser = async () => {
      const user_data = await fetchMe();
      setUser(user_data.nickname);
      setPicture(user_data.picture);
    };
    fetchUser();
  }, []);

  return (
    <div>
      <Link href="/myinfo" className="flex items-center space-x-[10px]">
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
      </Link>
    </div>
  );
}