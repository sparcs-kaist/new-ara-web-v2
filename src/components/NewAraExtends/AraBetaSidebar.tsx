import React, { useState } from "react";
import AraBetaButton from "./Floating/AraBetaButton";
import MealExtensionButton from "./Floating/MealExtensionButton";
import MealData from "./Floating/MealData"; 

export default function AraBetaSidebar() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMealDataVisible, setIsMealDataVisible] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
    // Sidebar가 닫힐 때 MealData도 함께 닫기
    if (isSidebarOpen) {
      setIsMealDataVisible(false);
    }
  };

  const toggleMealData = () => {
    // Sidebar가 열려있을 때만 토글 가능
    if (isSidebarOpen) {
      setIsMealDataVisible((prev) => !prev);
    }
  };

  return (
    <div className="fixed bottom-[30px] right-[30px]">
      <div className="cursor-pointer">
        <div onClick={toggleSidebar}>
          <AraBetaButton />
        </div>
        <div 
          className={`
            absolute bottom-0 right-full mr-4
            transition-all duration-300
            ${isMealDataVisible 
              ? "opacity-100 translate-x-0" 
              : "opacity-0 translate-x-4 pointer-events-none"}
          `}
        >
          <MealData />
        </div>
      </div>
      <div
        className={`
          absolute bottom-[80px] right-0 
          flex flex-col items-center 
          transition-all duration-300 
          ${isSidebarOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"}
        `}
      >
        <div onClick={toggleMealData} className="cursor-pointer">
          <MealExtensionButton />
        </div>
      </div>
    </div>
  );
}