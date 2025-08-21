
import React from "react";


import CalendarDate, { CalendarDateProps } from "./CalendarDate";

interface CalendarWeekProps {
  week: {
    date: Date;
    exist: boolean;
    type?: CalendarDateProps["type"];
  }[];
  size?: CalendarDateProps["size"];
  onDateClick: (date: Date) => void;
}

export interface CalendarSizeProps {
  size: CalendarDateProps["size"];
}



const CalendarWeek: React.FC<CalendarWeekProps> = ({
  week,
  size = "lg",
  onDateClick,
}) => (
  <div className="flex justify-evenly items-center w-full flex-1">
    {week.map(day => (
      <CalendarDate
        key={day.date.toISOString()}
        date={day.date}
        exist={day.exist}
        type={day.type}
        size={size}
        onDateClick={onDateClick}
      />
    ))}
  </div>
);

export default CalendarWeek;