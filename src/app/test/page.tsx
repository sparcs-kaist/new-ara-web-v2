'use client';

import React, { useState } from "react";
import Calendar from "@/components/Calendar/Calendar";
import { BasicNotificationList } from "@/containers/NotificationList";

const today = new Date();
const existDates = [today, new Date(today.getFullYear(), today.getMonth(), today.getDate() + 2)];
const eventPeriods = [
  { start: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1), end: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 4) }
];
const selectedDatesInit = [new Date(today.getFullYear(), today.getMonth(), today.getDate() + 3)];

export default function CalendarTestPage() {
  const [selectedDates, setSelectedDates] = useState(selectedDatesInit);

  const handleDateClick = (date: Date) => {
    alert(`날짜 클릭: ${date.toLocaleDateString()}`);
    setSelectedDates([date]);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white p-8">
      <h1 className="text-2xl font-bold mb-6">캘린더 컴포넌트 테스트</h1>
      <div className="w-full max-w-md">
        <Calendar
          size="sm"
          existDates={existDates}
          eventPeriods={eventPeriods}
          selectedDates={selectedDates}
          onDateClick={handleDateClick}
        />
        <BasicNotificationList />
      </div>
    </div>
  );
}
