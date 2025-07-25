'use client';

import DateNavigator from "./components/DateNavigator"; 
import RestaurantSelection from "./components/RestaurantSelection";
import AllergySelection from "./components/AllergySelection";
import MealHeader from "./components/MealHeader";

//WebView용 뒤로가기 기능 Handler
//Flutter 채널로 메시지 보내기
const handleClick = () => {
  (window as any).FlutterChannel?.postMessage('BackFromMeal');
};

export default function MealPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white p-8">
      <h1 className="text-2xl font-bold mb-6">학식 페이지</h1>
      <MealHeader onBackClick={handleClick} />
      {/* <AllergySelection /> */}
      {/* <DateNavigator /> */}
      {/* <RestaurantSelection /> */}
    </div>
  );
}