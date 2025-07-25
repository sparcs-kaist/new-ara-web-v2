'use client';

import React, { useEffect, useState } from 'react';

import DateNavigator from "./components/DateNavigator"; 
import MealHeader from "./components/MealHeader";
import RestaurantNavigator from "./components/RestaurantNavigator";
import MenuList from "./components/MenuList";

import { fetchCafeteriaMenu, fetchCourseMenu } from "@/lib/api/meal";
import { 
  CafeteriaMenuResponse, 
  CourseMenuResponse,
  RestaurantId,
  MealTime,
  CourseMenuItem,
  MenuItem,
  RESTAURANT_DISPLAY_NAMES
} from "@/lib/types/meal";

// WebView용 뒤로가기 기능 Handler
const handleClick = () => {
  (window as any).FlutterChannel?.postMessage('BackFromMeal');
};

// 날짜 formatting 함수 : convert into YYYY-MM-DD
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

// 학식 정보를 가져올 날짜 배열 생성
function getNextNDays(n: number): string[] {
  const dates = [];
  const today = new Date();
  for (let i = 0; i < n; i++) {
    const date = new Date();
    date.setDate(today.getDate() + i);
    dates.push(formatDate(date));
  }
  return dates;
}

function getRestaurantIdFromName(name: string): RestaurantId {
  const entries = Object.entries(RESTAURANT_DISPLAY_NAMES);
  const found = entries.find(([_, displayName]) => displayName === name);
  
  if (found) {
    return found[0] as RestaurantId;
  }
  return 'fclt';
}

function getMealTimeKey(time: string): MealTime {
  const lowerTime = time.toLowerCase();
  
  if (lowerTime === '아침') return MealTime.MORNING;
  if (lowerTime === '점심') return MealTime.LUNCH;
  if (lowerTime === '저녁') return MealTime.DINNER;
  
  return MealTime.LUNCH; //default value
}

export default function MealPage() {
  // 학식 정보
  const [courseMenuData, setCourseMenuData] = useState<Record<string, CourseMenuResponse>>({});
  const [cafeteriaMenuData, setCafeteriaMenuData] = useState<Record<string, CafeteriaMenuResponse>>({});

  // 현재 선택된 날짜와 식당
  const [selectedDate, setSelectedDate] = useState<string>(formatDate(new Date()));
  const [selectedRestaurant, setSelectedRestaurant] = useState<string>('카이마루');
  const [selectedTime, setSelectedTime] = useState<string>('점심');
  const [selectedAllergies, setSelectedAllergies] = useState<string[]>([]);

  const menuType = selectedRestaurant.includes('카페테리아') ? 'cafeteria' : 'course';

  useEffect(() => {
    const fetchData = async () => {
      const dates = getNextNDays(7);
      
      try {
        // 병렬로 모든 날짜의 데이터를 가져오기 위한 Promise 배열 생성
        const coursePromises = dates.map(date => fetchCourseMenu(date));
        const cafeteriaPromises = dates.map(date => fetchCafeteriaMenu(date));
        
        const courseResults = await Promise.allSettled(coursePromises);
        const newCourseData: Record<string, CourseMenuResponse> = {};
        
        courseResults.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            newCourseData[dates[index]] = result.value;
          }
        });
        setCourseMenuData(newCourseData);
        
        // 모든 카페테리아 메뉴 데이터 가져오기
        const cafeteriaResults = await Promise.allSettled(cafeteriaPromises);
        const newCafeteriaData: Record<string, CafeteriaMenuResponse> = {};
        
        cafeteriaResults.forEach((result, index) => {
          // 성공한 요청만 데이터에 추가
          if (result.status === 'fulfilled') {
            newCafeteriaData[dates[index]] = result.value;
          }
        });
        setCafeteriaMenuData(newCafeteriaData);
      } catch (error) {
        console.error("error:", error);
      }
    };
    
    fetchData();
  }, []);

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
  const getCurrentMenuData = (): CourseMenuItem[] | MenuItem[] => {
    try {
      const restaurantId = getRestaurantIdFromName(selectedRestaurant);
      const mealTime = getMealTimeKey(selectedTime);
      
      // 타입 안전한 접근 방식으로 변경
      if (menuType === 'cafeteria') {
        const cafeteriaData = cafeteriaMenuData[selectedDate];
        if (!cafeteriaData) return [];
        
        // 명시적 switch 문으로 타입 안전성 확보
        switch (mealTime) {
          case MealTime.MORNING:
            return cafeteriaData[restaurantId]?.morning_menu || [];
          case MealTime.LUNCH:
            return cafeteriaData[restaurantId]?.lunch_menu || [];
          case MealTime.DINNER:
            return cafeteriaData[restaurantId]?.dinner_menu || [];
          default:
            return [];
        }
      } else {
        const courseData = courseMenuData[selectedDate];
        if (!courseData) return [];
        
        // 명시적 switch 문으로 타입 안전성 확보
        switch (mealTime) {
          case MealTime.MORNING:
            return courseData[restaurantId]?.morning_menu || [];
          case MealTime.LUNCH:
            return courseData[restaurantId]?.lunch_menu || [];
          case MealTime.DINNER:
            return courseData[restaurantId]?.dinner_menu || [];
          default:
            return [];
        }
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

      <div className = "px-[15px] py-1 w-full">
        {/* 로딩 상태 표시 */}
        {!courseMenuData[selectedDate] && !cafeteriaMenuData[selectedDate] ? (
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