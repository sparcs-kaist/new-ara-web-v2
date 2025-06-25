// RestaurantSelection.tsx
import React, { useState } from "react";
interface RestaurantSelectionProps {
  onSelect: (restaurant: string) => void;
  initialRestaurant: string;
}

export default function RestaurantSelection({ 
  onSelect, 
  initialRestaurant 
}: RestaurantSelectionProps) {
  const [selectedLocation, setSelectedLocation] = useState(initialRestaurant);

  const restaurants = [
    "카이마루",
    "서맛골",
    "동맛골 1층",
    "카페테리아",
    "동맛골 2층",
    "교수회관"
  ];

  return (
    <div className="bg-white rounded-[20px] shadow-md">
      <div className="w-[290px] rounded-[20px] bg-white">
        <div className="p-[13px_13px_15px]">
          <div className="flex flex-wrap gap-[4px_6px] justify-center">
            {restaurants.map((restaurant) => (
              <button
                key={restaurant}
                onClick={() => {
                  setSelectedLocation(restaurant);
                  onSelect(restaurant);
                }}
                className={`
                  w-[84px] h-5 rounded-xl px-5 py-[3px] 
                  font-medium text-[11px] whitespace-nowrap 
                  transition-colors duration-200
                  flex items-center justify-center
                  bg-white text-black border
                  ${
                    selectedLocation === restaurant
                      ? "border-ara_red_bright border-2 text-ara_red_dark"
                      : "border-ara_gray_bright"
                  }
                `}
              >
                {restaurant}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}