"use client";
import NavBarProfile from "./NavBarProfile";
import Image from "next/image";
import NotificationButton from "./NotificationButton";

export default function NavBarRight () {
    return (
      <div
        className="flex items-center space-x-[10px] flex-shrink-0"
        style={{marginRight: "clamp(10px, 5vw, 150px)"}}>
        <NotificationButton />
        <NavBarProfile />
      </div>
    )
}