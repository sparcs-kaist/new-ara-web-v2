import Link from "next/link";
import Image from "next/image";

export default function NavBarProfile() {
  return (
    <div>
      <Link href="/myinfo" className="flex items-center space-x-[10px]">
        <Image src="/user.png" width = {24} height={24} alt="user profile image"/>
        <p>사용자 이름</p>
      </Link>
    </div>
  );
}