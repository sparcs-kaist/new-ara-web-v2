'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

import DateNavigator from "./components/DateNavigator";
import MealHeader from "./components/MealHeader";
import RestaurantNavigator from "./components/RestaurantNavigator";
import MenuList from "./components/MenuList";
import { Screen, Spinner } from '@/app/web_view/_components';
import { useSafeBack } from '@/app/web_view/hooks/useSafeBack';

import { fetchMeal } from '@/lib/api/meal';
import {
  MealResponse,
  Course,
  CafeteriaMenu,
  getRestaurantIdFromDisplayName,
  getMenuTypeFromRestaurantName,
  timeStringToMealType,
  currentMealSlot,
  ALLERGEN_MAP,
  MEAL_SLOTS,
} from '@/lib/types/meal';

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

function MealPageInner() {
  const onBack = useSafeBack();
  const timeParam = useSearchParams().get('time');
  const [mealData, setMealData] = useState<Record<string, MealResponse>>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const [selectedDate, setSelectedDate] = useState<string>(formatDate(new Date()));
  const [selectedRestaurant, setSelectedRestaurant] = useState<string>('카이마루');
  const [selectedTime, setSelectedTime] = useState<string>(
    () => MEAL_SLOTS.find((slot) => slot.time === timeParam)?.time ?? currentMealSlot().time
  );
  const [selectedAllergies, setSelectedAllergies] = useState<string[]>([]);

  const menuType = getMenuTypeFromRestaurantName(selectedRestaurant);

  useEffect(() => {
    const fetchCurrentData = async () => {
      const restaurantId = getRestaurantIdFromDisplayName(selectedRestaurant);
      const mealType = timeStringToMealType(selectedTime);
      const formattedDate = convertDateFormat(selectedDate);
      const key = `${formattedDate}-${restaurantId}-${mealType}`;

      if (mealData[key]) return;

      setIsLoading(true);
      try {
        const allergyCodes = selectedAllergies.length > 0
          ? getAllergyIdsFromNames(selectedAllergies)
          : undefined;

        const data = await fetchMeal(formattedDate, restaurantId, mealType, allergyCodes);

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

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
  };

  const handleRestaurantChange = (restaurant: string) => {
    setSelectedRestaurant(restaurant);
  };

  const handleMealTimeChange = (mealTime: string) => {
    setSelectedTime(mealTime);
  };

  const handleAllergyChange = (allergies: string[]) => {
    setSelectedAllergies(allergies);
  };

  const getCurrentMenuData = (): Course[] | CafeteriaMenu[] => {
    try {
      const restaurantId = getRestaurantIdFromDisplayName(selectedRestaurant);
      const mealType = timeStringToMealType(selectedTime);
      const formattedDate = convertDateFormat(selectedDate);
      const key = `${formattedDate}-${restaurantId}-${mealType}`;

      const data = mealData[key];
      if (!data) return [];

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
    <Screen withTabBar={false} className="items-center">
      <MealHeader
        onBackClick={onBack}
        backLabel="식사"
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
    </Screen>
  );
}

export default function MealPage() {
  return (
    <Suspense fallback={null}>
      <MealPageInner />
    </Suspense>
  );
}