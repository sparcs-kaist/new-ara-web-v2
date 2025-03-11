import Link from "next/link";

export default function NavBarMiddle() {
    return (
        <div className="hide-below-1200 flex flex-row space-x-[48px]">
        <Link href="/board" className="px-3 py-2 whitespace-nowrap">전체보기</Link>
        <Link href="/board/top" className="px-3 py-2 whitespace-nowrap">인기글 게시판</Link>
        <Link href="/board/talk" className="px-3 py-2 whitespace-nowrap">자유게시판</Link>
        <div className="px-3 py-2 whitespace-nowrap">학생단체 및 동아리</div>
        <div className="px-3 py-2 whitespace-nowrap">거래</div>
        <div className="px-3 py-2 whitespace-nowrap">소통</div>
      </div>
    )
}