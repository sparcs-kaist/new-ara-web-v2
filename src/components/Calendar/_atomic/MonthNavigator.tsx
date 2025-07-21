
import { addMonths, subMonths, format } from "date-fns";
import { ko } from "date-fns/locale";
import React from "react";



interface MonthNavigatorProps {
  currentDate: Date;
  onChange: (date: Date) => void;
}

// formatMonth 함수 직접 정의
const formatMonth = (date: Date) => format(date, "yyyy년 M월", { locale: ko });



const MonthNavigator: React.FC<MonthNavigatorProps> = ({
  currentDate,
  onChange = () => {},
}) => {
  const today = new Date();

  const handlePrevious = () => {
    const newDate = subMonths(currentDate, 1);
    onChange(newDate);
  };

  const handleNext = () => {
    const newDate = addMonths(currentDate, 1);
    onChange(newDate);
  };

  const handleTodayClick = () => {
    onChange(today);
  };

  return (
    <div className="flex items-center justify-between w-50 text-[16px] leading-5 font-medium font-pretendard text-black select-none gap-4">
      <button type="button" onClick={handlePrevious} className="p-1 rounded hover:bg-gray-100 transition">
        {/* chevron_left SVG */}
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M13 16L7 10L13 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <div className="flex-1 text-center cursor-pointer" onClick={handleTodayClick}>
        {formatMonth(currentDate)}
      </div>
      <button type="button" onClick={handleNext} className="p-1 rounded hover:bg-gray-100 transition">
        {/* chevron_right SVG */}
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M7 4L13 10L7 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  );
};

export default MonthNavigator;