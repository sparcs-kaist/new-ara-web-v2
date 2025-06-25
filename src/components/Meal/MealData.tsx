// MealData.tsx
import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import AllergyFilter from "./AllergyFilter";
import RestaurantSelection from "./RestaurantSelection";
import CourseMenuList from "./CourseMenuList";
import CafeteriaMenuList from "./CafeteriaMenuList";
import { Allergen, Restaurant, CafeteriaMenuItem, CafeteriaRestaurant } from './types';
import { initialAllergens } from "./utils";
import { fetchCafeteriaMenu, fetchCourseMenu } from '@/lib/api/meal'; 

// 식당 ID를 API 응답의 키값으로 매핑
type RestaurantKey = 'fclt' | 'west' | 'east1' | 'east2' | 'emp';
const restaurantKeyMap: { [key: string]: RestaurantKey } = {
  "카페테리아": "east1",
  "카이마루": "fclt",
  "서맛골": "west",
  "동맛골 1층": "east1",
  "동맛골 2층": "east2",
  "교수회관": "emp"
};

// 시간대를 API 응답의 키값으로 매핑
const mealTimeMap: { [key: string]: "morning_menu" | "lunch_menu" | "dinner_menu" } = {
  "아침": "morning_menu",
  "점심": "lunch_menu",
  "저녁": "dinner_menu"
};

export default function MealData() {
  // 알러지 필터 상태
  const [isAllergyFilterVisible, setIsAllergyFilterVisible] = useState(false);
  const [selectedAllergies, setSelectedAllergies] = useState(initialAllergens);
  
  const handleAllergyChange = (updatedAllergies: Allergen[]) => {
    setSelectedAllergies(updatedAllergies);
  };

  // Meal time options
  const mealOptions = ["아침", "점심", "저녁"];
  const [selectedMeal, setSelectedMeal] = useState("점심");
  
  // Date management
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Helper function to format date and day
  const formatDate = (date: Date) => {
    const days = ["일", "월", "화", "수", "목", "금", "토"];
    const day = days[date.getDay()];
    const formattedDate = `${date.getMonth() + 1}/${date.getDate()} (${day})`;
    return formattedDate;
  };

  // Handlers for changing the date
  const handleNextDay = () => {
    const nextDate = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000);
    setCurrentDate(nextDate);
  };

  const handlePreviousDay = () => {
    const prevDate = new Date(currentDate.getTime() - 24 * 60 * 60 * 1000);
    setCurrentDate(prevDate);
  };

  // 드롭다운 상태 관리
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState("카이마루");

  // 드롭다운 토글 함수
  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  // 식당 선택 시 호출될 함수
  const handleRestaurantSelect = (restaurant: string) => {
    setSelectedRestaurant(restaurant);
    setIsDropdownOpen(false);
    fetchMenuData(currentDate);
  };

  // 현재 선택된 식당과 시간에 해당하는 메뉴 데이터를 가져오는 함수
  const getCurrentMenuData = () => {
    if (selectedRestaurant === "카페테리아" || !courseMenuData) {
      return null;
    }

    const restaurantKey = restaurantKeyMap[selectedRestaurant];
    const timeKey = mealTimeMap[selectedMeal];
    
    if (!restaurantKey || !timeKey) {
      return null;
    }

    const restaurant = courseMenuData[restaurantKey] as Restaurant;
    if (!restaurant) return null;

    const menuData = restaurant[timeKey];
    
    if (!menuData || (Array.isArray(menuData) && menuData.length === 0)) {
      return null;
    }

    return menuData;
  };

  const getCurrentCafeteriaMenuData = () => {
    if (!cafeteriaMenuData) return null;

    const restaurantKey = "east1" as keyof typeof cafeteriaMenuData;
    const timeKey = mealTimeMap[selectedMeal];
    
    if (!timeKey) {
      return null;
    }

    const restaurant = cafeteriaMenuData[restaurantKey] as CafeteriaRestaurant;
    if (!restaurant) return null;

    const menuData = restaurant[timeKey] as CafeteriaMenuItem[];
    
    if (!menuData || menuData.length === 0) {
      return null;
    }

    return menuData;
  };

  //API response 관련 state
  const [courseMenuData, setCourseMenuData] = useState<Record<string, Restaurant> | null>(null);
  const [cafeteriaMenuData, setCafeteriaMenuData] = useState<Record<string, CafeteriaRestaurant> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  //date format function
  const formatDateForAPI = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  //Load Menu Data - 수정된 부분: 이미 import된 API 함수 사용
  const fetchMenuData = useCallback(async (date: Date) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const formattedDate = formatDateForAPI(date);
      const [courseData, cafeteriaData] = await Promise.all([
        fetchCourseMenu(formattedDate).catch(error => {
          if (error instanceof Error) {
            throw new Error(error.message);
          }
          throw new Error("메뉴를 불러오는데 실패했습니다.");
        }),
        fetchCafeteriaMenu(formattedDate).catch(error => {
          if (error instanceof Error) {
            throw new Error(error.message);
          }
          throw new Error("메뉴를 불러오는데 실패했습니다.");
        })
      ]);
      
      setCourseMenuData(courseData);
      setCafeteriaMenuData(cafeteriaData);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("메뉴를 불러오는데 실패했습니다.");
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // get menu when date changes
  useEffect(() => {
    fetchMenuData(currentDate);
  }, [currentDate, fetchMenuData]);

  return (
    <div className="w-[375px] h-auto p-4 bg-white rounded-2xl shadow font-inter relative">
      {/* 헤더 - 식당, 알러지 정보 설정 */}
      <div className="flex flex-col gap-0">
        <div className="flex items-center justify-between">
          {/* 오늘의 학식 */}
          <h2 className="font-semibold text-black text-[20px] mr-[8px]">🍽️ 오늘의 학식</h2>
          {/* 알러지 필터 */}
          <button 
            className="flex items-center gap-1 text-gray-500 text-xs font-semibold mr-auto"
            onClick={() => setIsAllergyFilterVisible((prev) => !prev)}
          >
            <span>알러지 ⚙️</span>
          </button>
          {isAllergyFilterVisible && (
            <div className="absolute top-0 right-full mr-2">
              <AllergyFilter 
                onAllergyChange={handleAllergyChange}
                initialAllergies={selectedAllergies}
              />
            </div>
          )}
          {/* 식당 선택 드롭다운 */}
          <div className="relative">
            <button
              className="flex items-center gap-[5px]"
              onClick={toggleDropdown}
            >
              <span className="font-semibold text-black text-[16px]">
                {selectedRestaurant}
              </span>
              <Image
                src="/NewAraExtendIcons/chevron-down.svg"
                alt="Down Arrow"
                width={16}
                height={16}
                className={`w-4 h-4 transition-transform duration-200 ${
                  isDropdownOpen ? "rotate-180" : ""
                }`}
              />
            </button>
            {/* 드롭다운 메뉴 */}
            {isDropdownOpen && (
              <div className="absolute top-full right-0 mt-2 z-50">
                <RestaurantSelection 
                  onSelect={handleRestaurantSelect} 
                  initialRestaurant={selectedRestaurant} 
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 구분선 */}
      <div className="w-full h-px bg-gray-200 my-0"></div>

      {/* 날짜 및 시간 선택 */}
      <div className="flex items-center justify-between mt-1">
        <div className="flex items-center gap-[3px] justify-start">
          <button onClick={handlePreviousDay}>
            <Image
              src="/NewAraExtendIcons/caret-left-fill.svg"
              alt="Left Arrow"
              width={14}
              height={14}
              className="w-[14px] h-[14px]"
            />
          </button>
          <div className="w-[70px] text-center">
            <span className="font-semibold text-black text-[14px]">{formatDate(currentDate)}</span>
          </div>
          <button onClick={handleNextDay}>
            <Image
              src="/NewAraExtendIcons/caret-right-fill.svg"
              alt="Right Arrow"
              width={14}
              height={14}
              className="w-[14px] h-[14px]"
            />
          </button>
        </div>
        <div className="flex items-center gap-2">
          {mealOptions.map((meal) => (
            <button
              key={meal}
              onClick={() => setSelectedMeal(meal)}
              className={`
                px-3 h-[21px] rounded-[10px] text-[12px] font-semibold
                bg-white text-black border
                ${
                  meal === selectedMeal
                    ? "border-ara_red_bright border-1 text-ara_red_dark"
                    : "border-gray-200"
                }
              `}
            >
              {meal}
            </button>
          ))}
        </div>
      </div>

      {/* 메뉴 리스트 */}
        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <span className="text-gray-500">로딩 중...</span>
          </div>
        ) : error ? (
          <div className="flex justify-center items-center h-40">
            <span className="text-gray-500">{error}</span>
          </div>
        ) : (
          selectedRestaurant === "카페테리아" ? (
            <CafeteriaMenuList 
              menuData={getCurrentCafeteriaMenuData()}
              selectedAllergies={selectedAllergies}
            />
          ) : (
            <CourseMenuList 
              menuData={getCurrentMenuData()}
              selectedAllergies={selectedAllergies}
            />
          )
        )}
    </div>
  );
}