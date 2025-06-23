"use client";

import Link from "next/link";
import { useState } from "react";

// 화살표 아이콘을 컴포넌트
const DropdownArrow = ({ isOpen, isHovered }: { isOpen: boolean, isHovered: boolean }) => (
  <svg 
    width="12" 
    height="12" 
    viewBox="0 0 12 12" 
    className={`transition-all duration-200 ${isOpen ? 'rotate-180' : ''}`}
  >
    <path 
      d="M3 5l3 3 3-3" //화살표
      stroke={isHovered ? '#DC2626' : '#666'} // ara_red 색상으로 변경
      strokeWidth="1.5" 
      fill="none" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  </svg>
);

export default function NavBarMiddle() {
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const handleMouseEnter = (menu: string) => {
    setActiveDropdown(menu);
    setHoveredItem(menu);
  };

  const handleMouseLeave = () => {
    setActiveDropdown(null);
    setHoveredItem(null);
  };

  return (
    <div className="hide-below-900 flex gap-[32px] font-medium">
      <Link href="/board/talk" className="py-2 whitespace-nowrap hover:text-ara_red transition-colors duration-200">자유게시판</Link>
      <Link href="/board" className="py-2 whitespace-nowrap hover:text-ara_red transition-colors duration-200">전체보기</Link>
      
      {/* 소식 드롭다운 */}
      <div 
        className="relative"
        onMouseEnter={() => handleMouseEnter('news')}
        onMouseLeave={handleMouseLeave}
      >
        <div className="py-2 whitespace-nowrap cursor-pointer flex items-center gap-3 hover:text-ara_red transition-colors duration-200">
          소식
          <DropdownArrow isOpen={activeDropdown === 'news'} isHovered={hoveredItem === 'news'} />
        </div>
        {activeDropdown === 'news' && (
          <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg min-w-[200px] z-50">
            <div className="py-2">
              <div className="px-4 py-2 font-medium text-gray-700">공지</div>
              <Link href="/board/notice/admin" className="block px-6 py-1 text-sm hover:bg-gray-100">- 운영진</Link>
              <Link href="/board/notice/portal" className="block px-6 py-1 text-sm hover:bg-gray-100">- 포탈</Link>
              <Link href="/board/notice/company" className="block px-6 py-1 text-sm hover:bg-gray-100">- 입주업체</Link>
              
              <div className="px-4 py-2 font-medium text-gray-700 mt-2">뉴스</div>
              <Link href="/board/news/kaist" className="block px-6 py-1 text-sm hover:bg-gray-100">- 카이스트 신문</Link>
              
              <div className="px-4 py-2 font-medium text-gray-700 mt-2">홍보</div>
              <Link href="/board/promotion/external" className="block px-6 py-1 text-sm hover:bg-gray-100">- 외부업체</Link>
            </div>
          </div>
        )}
      </div>

      {/* 거래 드롭다운 */}
      <div 
        className="relative"
        onMouseEnter={() => handleMouseEnter('market')}
        onMouseLeave={handleMouseLeave}
      >
        <div className="py-2 whitespace-nowrap cursor-pointer flex items-center gap-3 hover:text-ara_red transition-colors duration-200">
          거래
          <DropdownArrow isOpen={activeDropdown === 'market'} isHovered={hoveredItem === 'market'} />
        </div>
        {activeDropdown === 'market' && (
          <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg min-w-[150px] z-50">
            <div className="py-2">
              <Link href="/board/market/trade" className="block px-4 py-2 text-sm hover:bg-gray-100">거래</Link>
              <Link href="/board/market/realestate" className="block px-4 py-2 text-sm hover:bg-gray-100">부동산</Link>
              <Link href="/board/market/job" className="block px-4 py-2 text-sm hover:bg-gray-100">구인구직</Link>
            </div>
          </div>
        )}
      </div>

      {/* 소통 드롭다운 */}
      <div 
        className="relative"
        onMouseEnter={() => handleMouseEnter('communication')}
        onMouseLeave={handleMouseLeave}
      >
        <div className="py-2 whitespace-nowrap cursor-pointer flex items-center gap-3 hover:text-ara_red transition-colors duration-200">
          소통
          <DropdownArrow isOpen={activeDropdown === 'communication'} isHovered={hoveredItem === 'communication'} />
        </div>
        {activeDropdown === 'communication' && (
          <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg min-w-[200px] z-50">
            <div className="py-2">
              <div className="px-4 py-2 font-medium text-gray-700">의견</div>
              <Link href="/board/opinion/school" className="block px-6 py-1 text-sm hover:bg-gray-100">- 학교에게 전합니다</Link>
              
              <div className="px-4 py-2 font-medium text-gray-700 mt-2">단체</div>
              <Link href="/board/group/student" className="block px-6 py-1 text-sm hover:bg-gray-100">- 학생단체</Link>
              <Link href="/board/group/club" className="block px-6 py-1 text-sm hover:bg-gray-100">- 동아리</Link>
              
              <div className="px-4 py-2 font-medium text-gray-700 mt-2">피드백</div>
              <Link href="/board/feedback/ara" className="block px-6 py-1 text-sm hover:bg-gray-100">- 아라 피드백</Link>
              <Link href="/board/feedback/company" className="block px-6 py-1 text-sm hover:bg-gray-100">- 입주 업체</Link>
            </div>
          </div>
        )}
      </div>

      <Link href="/board/top" className="py-2 whitespace-nowrap hover:text-ara_red transition-colors duration-200">인기글</Link>
    </div>
  );
}