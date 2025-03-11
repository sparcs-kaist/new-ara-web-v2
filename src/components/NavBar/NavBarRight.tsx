"use client";
import {useState} from "react";
import Link from "next/link";
import NavBarProfile from "./NavBarProfile";

export default function NavBarRight () {
    return (
      <div
        className="flex items-center space-x-[10px] flex-shrink-0"
        style={{marginRight: "clamp(20px, 5vw, 150px"}}>
        <div className="relative flex items-center space-x-[10px]">
          <button className="relative flex-shrink-0">
            <img src="/language.png" className="w-5 h-5 min-w-[20px] min-h-[20px]" />
          </button>
        </div>

        {/* 사용자 프로필 */}
        <NavBarProfile />
      </div>

    )
}