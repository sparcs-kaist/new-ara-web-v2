// This component is from Clubs. Thanks for 'ava' !

import {
  addDays,
  eachWeekOfInterval,
  endOfMonth,
  isSameDay,
  isSameMonth,
  startOfMonth,
} from "date-fns";
import React, { useState } from "react";

import { CalendarDateProps } from "@/app/write/components/Calendar/_atomic/CalendarDate";
import CalendarWeek, { CalendarSizeProps } from "@/app/write/components/Calendar/_atomic/CalendarWeek";
import CalendarWeekdays from "@/app/write/components/Calendar/_atomic/CalendarWeekdays";
import MonthNavigator from "@/app/write/components/Calendar/_atomic/MonthNavigator";

interface EventPeriod {
  start: Date;
  end: Date;
}

interface CalendarProps extends CalendarSizeProps {
  existDates: Date[];
  eventPeriods: EventPeriod[];
  selectedDates: Date[];
  onDateClick?: (date: Date) => void;
}



const Calendar: React.FC<CalendarProps> = ({
  size = "md",
  existDates,
  eventPeriods,
  selectedDates,
  onDateClick = () => { },
}) => {
  const [currentDate, setCurrentDate] = useState(
    eventPeriods[0]?.start || new Date(),
  );

  const weeks = eachWeekOfInterval(
    {
      start: startOfMonth(currentDate),
      end: endOfMonth(currentDate),
    },
    { weekStartsOn: 0 },
  );

  const handleDateClick = (date: Date) => {
    if (date.getMonth() !== currentDate.getMonth()) {
      setCurrentDate(date);
    }
    onDateClick?.(date);
  };

  const getWeekData = (startDate: Date): CalendarDateProps[] =>
    Array.from({ length: 7 }).map((_, index) => {
      const day = addDays(startDate, index);
      const isCurrentMonth = isSameMonth(day, currentDate);
      const exist = existDates.some(existDate => isSameDay(existDate, day));

      let type: CalendarDateProps["type"] = isCurrentMonth ? "Default" : "Past/Future";

      if (!isCurrentMonth) {
        type = "Past/Future";
      } else if (
        selectedDates.some(selectedDate => isSameDay(selectedDate, day))
      ) {
        type = "Selected";
      }

      return {
        date: day,
        exist,
        type,
      };
    });


  return (
    <div className="flex flex-col items-center gap-5 w-full" data-size={size}>
      <MonthNavigator currentDate={currentDate} onChange={setCurrentDate} />
      <CalendarWeekdays size={size} />
      <div className="flex flex-col items-center gap-2 w-full">
        {weeks.map((weekStart: Date) => (
          <CalendarWeek
            week={getWeekData(weekStart)}
            size={size}
            key={weekStart.toISOString()}
            onDateClick={handleDateClick}
          />
        ))}
      </div>
    </div>
  );
};

export default Calendar;