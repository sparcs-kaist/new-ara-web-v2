import { useState, useEffect } from "react";
import Link from "next/link";
import NavBarMore from "./NavBarMore";
import { usePathname } from "next/navigation";
import Image from "next/image"
import NotiDetail from "./NotiDetail";

export default function NotificationButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="justify-center w-5 h-5">
      <div>
        <button onClick={() => setIsOpen(!isOpen)}>
          <Image src="/notification.png" width={17} height={20} alt="Notifications" />
        </button>
        {isOpen && (<NotiDetail />)}
      </div>
    </div>
  );
}
