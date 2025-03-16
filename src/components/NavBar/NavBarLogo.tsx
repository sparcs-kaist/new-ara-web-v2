import Link from "next/link";
import Image from "next/image";

export default function NavBarLogo() {
  return (
    <div 
      className="flex-shrink-0"
      style={{marginLeft: "clamp(20px, 5vw, 150px)", width: "64px", height: "35px" }}>
      <Link href="/">
        <Image src="/ServiceAra.png" width ={64} height={35} alt="Service Ara Logo" />
      </Link>
    </div>
  );
}