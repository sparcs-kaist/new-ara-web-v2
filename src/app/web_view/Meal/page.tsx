'use client';

import React, { useEffect, useState, useRef } from 'react';

import DateNavigator from "./components/DateNavigator"; 
import RestaurantSelection from "./components/RestaurantSelection";
import AllergySelection from "./components/AllergySelection";
import MealHeader from "./components/MealHeader";
import RestaurantNavigator from "./components/RestaurantNavigator";
import MenuList  from "./components/MenuList";

import { fetchCafeteriaMenu } from "@/lib/api/meal";
import { fetchCourseMenu } from "@/lib/api/meal";
import { set } from 'date-fns';

//WebView용 뒤로가기 기능 Handler
//Flutter 채널로 메시지 보내기
const handleClick = () => {
  (window as any).FlutterChannel?.postMessage('BackFromMeal');
};

// 날짜 formatting 함수 : convert into YYYY-MM-DD
function formatDate(date : Date) : string {
  return date.toISOString().split('T')[0];
}

// 학식 정보를 가져올 날짜 배열 생성
function getNextNDays(n : number) : string [] {
  const dates = [];
  const today = new Date();
  for (let i = 0 ; i < n ; i ++ ){
    const date = new Date();
    date.setDate(today.getDate() + i);
    dates.push(formatDate(date));
  }
  return dates;
}

export default function MealPage() {
  // 날짜별 학식 정보
  const [courseMenuData, setCourseMenuData] = useState<Record<string, any>>({});
  const [cafeteriaMenuData, setCafeteriaMenuData] = useState<Record<string, any>>({});

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
        
        // Promise.allSettled를 사용하여 성공한 요청만 처리
        const courseResults = await Promise.allSettled(coursePromises);
        const newCourseData: Record<string, any> = {};
        
        courseResults.forEach((result, index) => {
          // 성공한 요청만 데이터에 추가
          if (result.status === 'fulfilled') {
            newCourseData[dates[index]] = result.value;
          } else {
            console.log(`코스 메뉴 로드 실패 (${dates[index]}): ${result.reason}`);
            // 실패한 경우 빈 객체 또는 기본값 설정
            newCourseData[dates[index]] = {};
          }
        });
        setCourseMenuData(newCourseData);
        
        // 모든 카페테리아 메뉴 데이터 가져오기
        const cafeteriaResults = await Promise.allSettled(cafeteriaPromises);
        const newCafeteriaData: Record<string, any> = {};
        
        cafeteriaResults.forEach((result, index) => {
          // 성공한 요청만 데이터에 추가
          if (result.status === 'fulfilled') {
            newCafeteriaData[dates[index]] = result.value;
          } else {
            console.log(`카페테리아 메뉴 로드 실패 (${dates[index]}): ${result.reason}`);
            // 실패한 경우 빈 객체 또는 기본값 설정
            newCafeteriaData[dates[index]] = {};
          }
        });
        setCafeteriaMenuData(newCafeteriaData);
      } catch (error) {
        console.error("메뉴 데이터를 가져오는 중 오류 발생:", error);
      }
    };
    
    fetchData();
  }, []);

  // 날짜 변경 핸들러
  const handleDateChange = (date : string) => {
    setSelectedDate(date);
  };
  // 식당 변경 핸들러
  const handleRestaurantChange = (restaurant : string) => {
    setSelectedRestaurant(restaurant);
  };
  // 아침, 점심, 저녁 변경 핸들러
  const handleMealTimeChange = (mealTime : string) => {
    setSelectedTime(mealTime);
  };
  // 알러지 필터
  const handleAllergyChange = (allergies : string[]) => {
    setSelectedAllergies(allergies);
  };
  // 현재 Option에 맞는 Data 가져오기
  const currentMenuData = (() => {
    try {
      if (menuType === 'cafeteria') {
        return cafeteriaMenuData[selectedDate]?.[selectedRestaurant]?.[selectedTime.toLowerCase()] || [];
      } else {
        return courseMenuData[selectedDate]?.[selectedRestaurant]?.[selectedTime.toLowerCase()] || [];
      }
    } catch (error) {
      console.error("메뉴 데이터 접근 중 오류:", error);
      return []; // 오류 발생 시 빈 배열 반환
    }
  })();

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
      
      {/* 로딩 상태 표시 */}
      {!courseMenuData[selectedDate] && !cafeteriaMenuData[selectedDate] ? (
        <div className="flex justify-center items-center h-40">
          <span className="text-gray-500">메뉴를 불러오는 중...</span>
        </div>
      ) : (
        <MenuList
          menuType={menuType}
          menuData={currentMenuData}
          selectedAllergies={selectedAllergies}
        />
      )}
    </div>
  );
}