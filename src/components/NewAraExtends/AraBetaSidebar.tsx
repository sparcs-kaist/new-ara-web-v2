import React, { useState } from "react";
import AraBetaButton from "./Floating/AraBetaButton";
import MealExtensionButton from "./Floating/MealExtensionButton";
import MealData from "./Floating/MealData"; 

/*
지금 프론트가 마이그레이션 중인 관계로 컴포넌트를 Next로 만들되되, 
구레포에 embed해 빠르게 beta version을 출시할 수 있도록 설계하였습니다. 
따라서 컴포넌트의 구조 변경이 필요한 페이지를 만드는 대신에 floating으로 컴포넌트들을 포장하여 
extension처럼 사용할 수 있도록 하였습니다. 
(자세한 내용은 Notion에 Extends NewAra 문서를 읽어보시면 될 것 같습니다. )*/

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