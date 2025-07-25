'use client'

import { useState } from 'react';

// 식당 이름만 배열로 관리 (id 제거)
const restaurantNames = [
  '카이마루',
  '동맛골 1층 (일품)',
  '동맛골 1층 (카페테리아)',
  '동맛골 2층 (동측 교직원식당)',
  '서맛골',
  '교수회관',
];

// 체크 아이콘 컴포넌트
const CheckIcon = () => (
  <div className="relative">
    <svg width="12" height="17" viewBox="0 0 12 17" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4.3975 11.0833L2.6625 8.77002C2.4675 8.51002 2.1525 8.51002 1.9575 8.77002C1.7625 9.03002 1.7625 9.45002 1.9575 9.71002L4.0475 12.4967C4.2425 12.7567 4.5575 12.7567 4.7525 12.4967L10.0425 5.44335C10.2375 5.18335 10.2375 4.76335 10.0425 4.50335C9.8475 4.24335 9.5325 4.24335 9.3375 4.50335L4.3975 11.0833Z" fill="black"/>
    </svg>
  </div>
);

// 비어있는 체크 아이콘 컴포넌트
const EmptyCheckIcon = () => (
  <div className="w-3 h-4 relative opacity-0 overflow-hidden">
    <div className="w-2 h-2 left-[1.81px] top-[3.81px] absolute bg-black" />
  </div>
);

export default function RestaurantSelection({ 
  onSelect, 
  defaultSelected = 2  // 인덱스로 기본값 설정 (카페테리아 = 2)
}: { 
  onSelect?: (name: string) => void; 
  defaultSelected?: number 
}) {
  const [selectedIndex, setSelectedIndex] = useState(defaultSelected);

  const handleSelect = (index: number) => {
    setSelectedIndex(index);
    if (onSelect) {
      onSelect(restaurantNames[index]);
    }
  };

  return (
    <div
      className="w-60 left-0 top-0 absolute rounded-xl shadow-[0px_0px_19.9px_0px_rgba(0,0,0,0.15)] flex flex-col"
      style={{ background: "rgba(255,255,255,0.96)" }}
    >
      {/* 헤더 */}
      <div className="self-stretch pl-5 pr-7 py-2 flex items-center">
        <div className="text-[#696969] font-semibold text-[11px]">식당 선택</div>
      </div>
      
      <div className="h-px bg-gray-200 w-full"></div>
      
      {/* 식당 목록 */}
      {restaurantNames.map((name, index) => (
        <div key={name}>
          <div 
            className="self-stretch px-[5px] py-3 flex items-center gap-[5px] cursor-pointer hover:bg-gray-50"
            onClick={() => handleSelect(index)}
          >
            {selectedIndex === index ? <CheckIcon /> : <EmptyCheckIcon />}
            <div className="text-[16px] font-normal">
              {name}
            </div>
          </div>
          
          {/* 마지막 아이템이 아닌 경우에만 구분선 표시 */}
          {index < restaurantNames.length - 1 && (
            <div className="h-px bg-gray-200 w-full"></div>
          )}
        </div>
      ))}
    </div>
  );
}