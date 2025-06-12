"use client";
import NavBarProfile from "./NavBarProfile";
import Image from "next/image";
import NotificationButton from "./NotificationButton";

export default function NavBarRight () {
    return (
      <div
        className="flex items-center space-x-[10px] flex-shrink-0"
        style={{marginRight: "clamp(10px, 5vw, 150px"}}>
        <div className="relative flex items-center space-x-[10px]">
          <button className="relative flex-shrink-0">
            <Image src="/language.png" width={20} height={20} alt="change language image"/>
          </button>
        </div>
        <NotificationButton />
        {/* 사용자 프로필 */}
        <NavBarProfile />
      </div>
    )
}