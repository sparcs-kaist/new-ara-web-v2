import Link from "next/link";

export default function NavBarMiddle() {
    return (
      <div className="hide-below-900 flex gap-[32px]">
          <Link href="/board" className="py-2 whitespace-nowrap">전체보기</Link>
          <Link href="/board/top" className="py-2 whitespace-nowrap">인기글</Link>
          <Link href="/board/talk" className="py-2 whitespace-nowrap">자유게시판</Link>
          <div className=" py-2 whitespace-nowrap">학생단체 및 동아리</div>
          <div className=" py-2 whitespace-nowrap">거래</div>
          <div className=" py-2 whitespace-nowrap">소통</div>
      </div>
    )
}