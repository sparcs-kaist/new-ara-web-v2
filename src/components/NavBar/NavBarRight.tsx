"use client";
import NavBarProfile from "./NavBarProfile";
import NotificationButton from "./NotificationButton";
import PostWriteButton from "./PostWriteButton";

export default function NavBarRight() {
  return (
    <div
      className="flex items-center space-x-[10px] flex-shrink-0"
      style={{ marginRight: "clamp(10px, 5vw, 150px)" }}>
      <PostWriteButton />
      <NotificationButton />
      <NavBarProfile />
    </div>
  )
}