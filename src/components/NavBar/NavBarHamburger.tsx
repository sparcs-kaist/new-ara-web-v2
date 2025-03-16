import { useState, useEffect } from "react";
import Link from "next/link";
import NavBarMore from "./NavBarMore";
import { usePathname } from "next/navigation";
import Image from "next/image"

export default function NavBarHamburger() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  return (
    <div
    style={{marginRight: "clamp(20px, 5vw, 150px"}}
    className="flex justify-center items-center space-x-[10px]">
      {/*글쓰기 버튼*/}
      <Link href="/write">
        <Image src="/write.png" width ={24} height={24} alt="글쓰기"/>
      </Link>
      
      {/*메뉴 버튼*/}
      <div>
        <button onClick={() => setIsOpen(!isOpen)} className="p-2">
          <Image src={isOpen ? "/NavBarClose.png" : "/NavBarHamburger.png"}  width={24} height={24} alt="Menu" />
        </button>
        {isOpen && (<NavBarMore onClose={() => setIsOpen(false)}/>)}
      </div>
    </div>
  );
}
