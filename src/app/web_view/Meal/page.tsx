/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useEffect, useState } from 'react';

import DateNavigator from "./components/DateNavigator";
import MealHeader from "./components/MealHeader";
import RestaurantNavigator from "./components/RestaurantNavigator";
import MenuList from "./components/MenuList";
import { Spinner } from '@/app/web_view/_components';

import { fetchMeal } from '@/lib/api/meal';
import {
  MealResponse,
  Course,
  CafeteriaMenu,
  getRestaurantIdFromDisplayName,
  getMenuTypeFromRestaurantName,
  timeStringToMealType,
  ALLERGEN_MAP,
} from '@/lib/types/meal';

// WebView용 뒤로가기 기능 Handler
const handleClick = () => {
  // Flutter WebView로 시그널 전송
  (window as any).FlutterChannel?.postMessage('meal_page_exit');
};

// 알러지 이름을 ID로 변환하는 함수
function getAllergyIdsFromNames(allergyNames: string[]): string {
  // ALLERGEN_MAP을 역으로 매핑 (이름 -> ID)
  const nameToIdMap: Record<string, number> = {};
  Object.entries(ALLERGEN_MAP).forEach(([id, name]) => {
    nameToIdMap[name] = parseInt(id);
  });

  // 알러지 이름들을 ID로 변환
  const ids = allergyNames
    .map(name => nameToIdMap[name])
    .filter(id => id !== undefined);

  // 쉼표로 구분된 문자열로 반환
  return ids.join(',');
}

// 날짜 formatting 함수 : convert into YYYYMMDD
function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

// YYYY-MM-DD를 YYYYMMDD로 변환
function convertDateFormat(dateStr: string): string {
  // YYYY-MM-DD 형식이면 대시 제거
  return dateStr.replace(/-/g, '');
}

export default function MealPage() {
  // 학식 정보 - 캐시 역할 (key: "날짜-식당ID-식사시간")
  const [mealData, setMealData] = useState<Record<string, MealResponse>>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // 현재 선택된 날짜와 식당
  const [selectedDate, setSelectedDate] = useState<string>(formatDate(new Date()));
  const [selectedRestaurant, setSelectedRestaurant] = useState<string>('카이마루');
  const [selectedTime, setSelectedTime] = useState<string>('점심');
  const [selectedAllergies, setSelectedAllergies] = useState<string[]>([]);

  // 메뉴 타입은 식당 이름으로 결정 (카페테리아가 포함되어 있으면 cafeteria)
  const menuType = getMenuTypeFromRestaurantName(selectedRestaurant);

  // 선택된 옵션이 바뀔 때마다 해당 데이터만 가져오기
  useEffect(() => {
    const fetchCurrentData = async () => {
      const restaurantId = getRestaurantIdFromDisplayName(selectedRestaurant);
      const mealType = timeStringToMealType(selectedTime);
      // 날짜를 YYYYMMDD 형식으로 변환
      const formattedDate = convertDateFormat(selectedDate);
      const key = `${formattedDate}-${restaurantId}-${mealType}`;

      // 이미 캐시에 있으면 다시 가져오지 않음
      if (mealData[key]) {
        console.log('Using cached data for:', key);
        return;
      }

      setIsLoading(true);
      try {
        // 알러지 이름을 ID로 변환
        const allergyCodes = selectedAllergies.length > 0
          ? getAllergyIdsFromNames(selectedAllergies)
          : undefined;

        console.log('Fetching meal data:', { date: formattedDate, restaurantId, mealType, allergyCodes });
        const data = await fetchMeal(formattedDate, restaurantId, mealType, allergyCodes);
        console.log('Received data:', data);

        setMealData(prev => ({
          ...prev,
          [key]: data
        }));
      } catch (error) {
        console.error(`Error fetching ${key}:`, error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCurrentData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, selectedRestaurant, selectedTime, selectedAllergies]);

  // 날짜 변경 핸들러
  const handleDateChange = (date: string) => {
    setSelectedDate(date);
  };

  // 식당 변경 핸들러
  const handleRestaurantChange = (restaurant: string) => {
    setSelectedRestaurant(restaurant);
  };

  // 아침, 점심, 저녁 변경 핸들러
  const handleMealTimeChange = (mealTime: string) => {
    setSelectedTime(mealTime);
  };

  // 알러지 필터
  const handleAllergyChange = (allergies: string[]) => {
    setSelectedAllergies(allergies);
  };

  // 현재 Option에 맞는 Data 가져오기
  const getCurrentMenuData = (): Course[] | CafeteriaMenu[] => {
    try {
      const restaurantId = getRestaurantIdFromDisplayName(selectedRestaurant);
      const mealType = timeStringToMealType(selectedTime);
      const formattedDate = convertDateFormat(selectedDate);
      const key = `${formattedDate}-${restaurantId}-${mealType}`;

      const data = mealData[key];
      if (!data) return [];

      // 식당 이름으로 메뉴 타입 결정
      const menuType = getMenuTypeFromRestaurantName(selectedRestaurant);

      if (menuType === 'course') {
        return data.courses || [];
      } else {
        return data.cafeteria_menus || [];
      }
    } catch (error) {
      console.error("error:", error);
      return [];
    }
  };

  const currentMenuData = getCurrentMenuData();

  return (
    <div className="min-h-screen flex flex-col items-center bg-white">
      <MealHeader
        onBackClick={handleClick}
        onAllergyChange={handleAllergyChange}
      />

      <DateNavigator
        selectedDate={selectedDate}
        onDateChange={handleDateChange}
      />

      <RestaurantNavigator
        selectedRestaurant={selectedRestaurant}
        selectedMealTime={selectedTime}
        onRestaurantChange={handleRestaurantChange}
        onMealTimeChange={handleMealTimeChange}
      />

      <div className="px-[15px] py-1 w-full">
        {/* 로딩 상태 표시 */}
        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <Spinner size={28} />
          </div>
        ) : currentMenuData.length === 0 ? (
          <div className="flex justify-center items-center h-40">
            <span className="text-gray-500">해당 시간의 학식 정보를 찾을 수 없습니다.</span>
          </div>
        ) : (
          <MenuList
            menuType={menuType}
            menuData={currentMenuData}
            selectedAllergies={selectedAllergies}
          />
        )}
      </div>
    </div>
  );
}