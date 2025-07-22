"use client";

import { useState, useEffect } from "react";
// import Link from "next/link";
import NavBarLogo from "@/components/NavBar/NavBarLogo";
import NavBarRight from "@/components/NavBar/NavBarRight";
import NavBarMiddle from "@/components/NavBar/NavBarMiddle";
import NavBarHamburger from "@/components/NavBar/NavBarHamburger";


export default function Navbar() {
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 900);
    };

    // 초기 실행
    handleResize();
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);
  
  return (
    <nav className="flex w-full mx-auto items-center justify-between h-[77px] p-5">
      <NavBarLogo />
      <NavBarMiddle />
      {isMobile ? <NavBarHamburger /> : <NavBarRight />}
    </nav>
  );
}
