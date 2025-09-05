
import React from "react";

export interface CalendarSizeProps {
  size?: "lg" | "md" | "sm";
}

const getHeight = (size?: "lg" | "md" | "sm") => {
  switch (size) {
    case "sm":
      return "h-8"; // 32px
    case "md":
      return "h-10"; // 40px
    case "lg":
    default:
      return "h-12"; // 48px
  }
};

const CalendarWeekdays: React.FC<CalendarSizeProps> = ({ size }) => (
  <div className="flex justify-evenly items-center w-full">
    {["일", "월", "화", "수", "목", "금", "토"].map(day => (
      <div
        key={day}
        className={`flex-1 flex items-center justify-center text-[16px] font-medium leading-5 font-pretendard text-gray-600 w-full ${getHeight(size)}`}
      >
        {day}
      </div>
    ))}
  </div>
);

export default CalendarWeekdays;