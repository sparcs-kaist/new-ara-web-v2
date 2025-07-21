
import React from "react";

export interface CalendarDateProps {
  date: Date;
  exist: boolean;
  type?: "Default" | "Pass" | "Start" | "End" | "Selected" | "Past/Future";
  size?: "lg" | "md" | "sm";
  onDateClick?: (date: Date) => void;
}


// Tailwind 기반 동적 스타일 함수
const getDateSize = (size?: "lg" | "md" | "sm") => {
  switch (size) {
    case "sm":
      return "w-8 h-8 text-[16px]"; // 32px
    case "md":
      return "w-10 h-10 text-[16px]"; // 40px
    case "lg":
    default:
      return "w-12 h-12 text-[16px]"; // 48px
  }
};

const getDateBg = (type?: CalendarDateProps["type"]) => {
  if (type === "Pass") return "bg-mint-300";
  if (type === "Start") return "bg-gradient-to-r from-mint-300 to-transparent";
  if (type === "End") return "bg-gradient-to-l from-mint-300 to-transparent";
  return "bg-transparent";
};

const getDateText = (type?: CalendarDateProps["type"]) => {
  if (type === "Default") return "text-black";
  if (type === "Past/Future") return "text-gray-300";
  if (type === "Selected") return "text-[#ed3a3a]"; //ara 색상 코드
  return "text-white";
};

const getWrapperHeight = (size?: "lg" | "md" | "sm") => {
  switch (size) {
    case "sm":
      return "h-8";
    case "md":
      return "h-10";
    case "lg":
    default:
      return "h-12";
  }
};

const getExistDotColor = (type?: CalendarDateProps["type"]) => {
  if (type === "Default") return "bg-primary";
  if (type === "Past/Future") return "bg-gray-300";
  return "bg-white";
};


const CalendarDate: React.FC<CalendarDateProps> = ({
  date,
  exist,
  type = "Default",
  size = "lg",
  onDateClick = () => {},
}) => {
  const handleClick = () => {
    if (onDateClick) {
      onDateClick(date);
    }
  };

  return (
    <div
      className={`flex items-center justify-center flex-1 w-full ${getWrapperHeight(size)} ${exist ? "cursor-pointer" : "cursor-default"} ${(() => {
        if (type === "End") return "bg-gradient-to-l from-mint-300 to-transparent";
        if (type === "Start") return "bg-gradient-to-r from-mint-300 to-transparent";
        if (type === "Pass") return "bg-mint-300";
        return "bg-transparent";
      })()}`}
      onClick={handleClick}
    >
      <div
        className={`flex items-center justify-center rounded text-[16px] font-medium leading-5 font-pretendard ${getDateSize(size)} ${getDateBg(type)} ${getDateText(type)}`}
      >
        <div className="relative flex items-center justify-center w-6 h-6">
          {date.getDate()}
          {exist && (
            <span className={`absolute right-0 top-0 w-1 h-1 rounded bg-primary ${getExistDotColor(type)}`}></span>
          )}
        </div>
      </div>
    </div>
  );
};

export default CalendarDate;