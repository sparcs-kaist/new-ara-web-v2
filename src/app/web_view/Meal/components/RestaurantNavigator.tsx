'use client';

import { useState, useEffect, useRef } from 'react';
import RestaurantSelection from './RestaurantSelection';

// 식사 시간 배열 - 단순 문자열로 관리
const mealTimes = ['아침', '점심', '저녁'];

// 화살표 아이콘 컴포넌트
const ArrowIcon = () => (
  <svg width="22" height="23" viewBox="0 0 22 23" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M11 5.50725L13.255 7.76225C13.6125 8.11975 14.19 8.11975 14.5475 7.76225C14.905 7.40475 14.905 6.82725 14.5475 6.46975L11.6417 3.55475C11.2842 3.19725 10.7067 3.19725 10.3492 3.55475L7.44336 6.46975C7.08586 6.82725 7.08586 7.40475 7.44336 7.76225C7.80086 8.11975 8.37836 8.11975 8.73586 7.76225L11 5.50725ZM11 16.8189L8.74502 14.5639C8.38752 14.2064 7.81002 14.2064 7.45252 14.5639C7.09502 14.9214 7.09502 15.4989 7.45252 15.8564L10.3584 18.7714C10.7159 19.1289 11.2934 19.1289 11.6509 18.7714L14.5567 15.8656C14.9142 15.5081 14.9142 14.9306 14.5567 14.5731C14.1992 14.2156 13.6217 14.2156 13.2642 14.5731L11 16.8189Z" fill="black"/>
  </svg>
);

// 시간 선택 버튼 컴포넌트
interface TimeButtonProps {
  label: string;
  isSelected: boolean;
  onClick: () => void;
}

const TimeButton = ({ label, isSelected, onClick }: TimeButtonProps) => (
  <div 
    className={`w-12 h-5 px-3 py-[3px] rounded-[10px] flex justify-center items-center cursor-pointer
      ${isSelected 
        ? 'bg-red-500 text-white' 
        : 'bg-white text-black outline outline-1 outline-zinc-100'
      }`}
    onClick={onClick}
  >
    <div className="text-center text-xs font-semibold">
      {label}
    </div>
  </div>
);

interface RestaurantNavigatorProps {
  selectedRestaurant: string;
  selectedMealTime: string;
  onRestaurantChange?: (restaurant: string) => void;
  onMealTimeChange?: (time: string) => void;
}

export default function RestaurantNavigator({
  selectedRestaurant = '동맛골 1층 (카페테리아)',
  selectedMealTime = '점심',
  onRestaurantChange,
  onMealTimeChange
}: RestaurantNavigatorProps) {
  // 모달 표시 상태만 내부에서 관리
  const [showRestaurantModal, setShowRestaurantModal] = useState(false);
  
  // 식당 선택 영역의 ref
  const restaurantSelectorRef = useRef<HTMLDivElement>(null);

  // 외부 클릭 시 모달 닫기 이벤트 핸들러
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (restaurantSelectorRef.current && 
          !restaurantSelectorRef.current.contains(event.target as Node)) {
        setShowRestaurantModal(false);
      }
    }

    // 모달이 열려있을 때만 이벤트 리스너 추가
    if (showRestaurantModal) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showRestaurantModal]);

  const handleRestaurantClick = () => {
    setShowRestaurantModal(true);
  };

  const handleRestaurantSelect = (name: string) => {
    setShowRestaurantModal(false);
    if (onRestaurantChange) {
      onRestaurantChange(name);
    }
  };

  const handleTimeSelect = (time: string) => {
    if (onMealTimeChange) {
      onMealTimeChange(time);
    }
  };

  // 식당 이름 목록에서 현재 선택된 식당의 인덱스 찾기
  const getSelectedRestaurantIndex = () => {
    const restaurantNames = [
      '카이마루',
      '동맛골 1층 (일품)',
      '동맛골 1층 (카페테리아)',
      '동맛골 2층 (동측 교직원식당)',
      '서맛골',
      '교수회관',
    ];
    
    return restaurantNames.findIndex(name => name === selectedRestaurant) || 2;
  };

  return (
    <div className="flex justify-between items-center w-full py-2 relative px-[15px]">
      {/* 식당 선택 영역 */}
      <div 
        ref={restaurantSelectorRef}
        className="flex items-center cursor-pointer relative"
        onClick={handleRestaurantClick}
      >
        <div className="text-zinc-800 text-base font-bold">
          {selectedRestaurant}
        </div>
        <div className="ml-1">
          <ArrowIcon />
        </div>
        
        {/* 식당 선택 모달 - 버튼 아래에 위치하도록 배치 */}
        {showRestaurantModal && (
          <div className="absolute top-full left-0 mt-1 z-10">
            <RestaurantSelection 
              onSelect={handleRestaurantSelect} 
              defaultSelected={getSelectedRestaurantIndex()}
            />
          </div>
        )}
      </div>

      {/* 시간 선택 영역 */}
      <div className="flex items-center gap-1">
        {mealTimes.map((time, index) => (
          <TimeButton 
            key={index}
            label={time}
            isSelected={selectedMealTime === time}
            onClick={() => handleTimeSelect(time)}
          />
        ))}
      </div>
    </div>
  );
}