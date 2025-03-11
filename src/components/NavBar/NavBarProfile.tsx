import Link from "next/link";

export default function NavBarProfile() {
  return (
    <div>
      <Link href="/myinfo" className="flex items-center space-x-[10px]">
        <img src="/user.png"/>
        <p>사용자 이름</p>
      </Link>
    </div>
  );
}