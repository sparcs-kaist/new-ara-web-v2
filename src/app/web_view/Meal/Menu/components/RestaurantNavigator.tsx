'use client';

import { useState, useEffect, useRef } from 'react';
import { ChoiceChip } from '@/app/web_view/_components';
import { RESTAURANT_NAMES, type RestaurantId } from '@/lib/types/meal';
import RestaurantSelection from './RestaurantSelection';

// 식사 시간 배열 - 단순 문자열로 관리
const mealTimes = ['아침', '점심', '저녁'];

// 화살표 아이콘 컴포넌트
const ArrowIcon = () => (
  <svg width="22" height="23" viewBox="0 0 22 23" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M11 5.50725L13.255 7.76225C13.6125 8.11975 14.19 8.11975 14.5475 7.76225C14.905 7.40475 14.905 6.82725 14.5475 6.46975L11.6417 3.55475C11.2842 3.19725 10.7067 3.19725 10.3492 3.55475L7.44336 6.46975C7.08586 6.82725 7.08586 7.40475 7.44336 7.76225C7.80086 8.11975 8.37836 8.11975 8.73586 7.76225L11 5.50725ZM11 16.8189L8.74502 14.5639C8.38752 14.2064 7.81002 14.2064 7.45252 14.5639C7.09502 14.9214 7.09502 15.4989 7.45252 15.8564L10.3584 18.7714C10.7159 19.1289 11.2934 19.1289 11.6509 18.7714L14.5567 15.8656C14.9142 15.5081 14.9142 14.9306 14.5567 14.5731C14.1992 14.2156 13.6217 14.2156 13.2642 14.5731L11 16.8189Z" fill="black"/>
  </svg>
);

interface RestaurantNavigatorProps {
  selectedRestaurant: RestaurantId;
  selectedMealTime: string;
  onRestaurantChange?: (restaurant: RestaurantId) => void;
  onMealTimeChange?: (time: string) => void;
}

export default function RestaurantNavigator({
  selectedRestaurant,
  selectedMealTime = '점심',
  onRestaurantChange,
  onMealTimeChange
}: RestaurantNavigatorProps) {
  const [showRestaurantModal, setShowRestaurantModal] = useState(false);
  
  const restaurantSelectorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (restaurantSelectorRef.current && 
          !restaurantSelectorRef.current.contains(event.target as Node)) {
        setShowRestaurantModal(false);
      }
    }

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

  const handleRestaurantSelect = (restaurant: RestaurantId) => {
    setShowRestaurantModal(false);
    if (onRestaurantChange) {
      onRestaurantChange(restaurant);
    }
  };

  const handleTimeSelect = (time: string) => {
    if (onMealTimeChange) {
      onMealTimeChange(time);
    }
  };

  return (
    <div className="flex justify-between items-center w-full py-2 relative px-[15px]">
      <div ref={restaurantSelectorRef} className="relative">
        <button type="button" className="flex items-center" onClick={handleRestaurantClick}>
          <div className="text-zinc-800 text-base font-bold">
            {RESTAURANT_NAMES[selectedRestaurant]}
          </div>
          <div className="ml-1">
            <ArrowIcon />
          </div>
        </button>

        {showRestaurantModal && (
          <div className="absolute top-full left-0 mt-1 z-10">
            <RestaurantSelection 
              onSelect={handleRestaurantSelect} 
              selected={selectedRestaurant}
            />
          </div>
        )}
      </div>

      <div className="flex items-center gap-1.5">
        {mealTimes.map((time, index) => (
          <ChoiceChip
            key={index}
            size="sm"
            selected={selectedMealTime === time}
            onClick={() => handleTimeSelect(time)}
            className="w-[52px]"
          >
            {time}
          </ChoiceChip>
        ))}
      </div>
    </div>
  );
}