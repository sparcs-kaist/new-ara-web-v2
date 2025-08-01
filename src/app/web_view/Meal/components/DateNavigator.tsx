// 학식 기능 날짜 설정을 위한 컴포넌트
'use client'

import { useState, useEffect } from 'react';
import { format, addDays, parse } from 'date-fns';
import { ko } from 'date-fns/locale';

interface DateNavigatorProps {
  selectedDate?: string; // YYYY-MM-DD 형식으로 받음
  onDateChange?: (date: string) => void; // YYYY-MM-DD 형식으로 반환
}

export default function DateNavigator({ selectedDate, onDateChange }: DateNavigatorProps) {
    // 기본 날짜는 오늘
    const today = new Date();
    
    // 선택된 날짜를 Date 객체로 변환 (제공되지 않으면 오늘 날짜 사용)
    const selectedDateObj = selectedDate 
      ? parse(selectedDate, 'yyyy-MM-dd', new Date())
      : today;
    
    // 표시할 날짜 범위 계산 (오늘부터 7일)
    const [visibleDates, setVisibleDates] = useState<Date[]>([]);

    // 날짜 표시를 위한 함수
    const generateDates = () => {
        const dates = [];
        // 오늘 포함해서 7일 표시
        for (let i = 0; i < 7; i++) {
            dates.push(addDays(today, i));
        }
        return dates;
    };

    // 날짜 선택 핸들러
    const handleDateSelect = (date: Date) => {
        if (onDateChange) {
            // YYYY-MM-DD 형식으로 변환하여 부모에 전달
            const formattedDate = format(date, 'yyyy-MM-dd');
            onDateChange(formattedDate);
        }
    };

    // 날짜가 오늘인지 확인하는 함수
    const isToday = (date: Date) => {
        return (
            date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear()
        );
    };

    // 날짜가 내일인지 확인하는 함수
    const isTomorrow = (date: Date) => {
        const tomorrow = addDays(today, 1);
        return (
            date.getDate() === tomorrow.getDate() &&
            date.getMonth() === tomorrow.getMonth() &&
            date.getFullYear() === tomorrow.getFullYear()
        );
    }

    // 날짜가 현재 선택된 날짜인지 확인하는 함수
    const isSelected = (date: Date) => {
        return (
            date.getDate() === selectedDateObj.getDate() &&
            date.getMonth() === selectedDateObj.getMonth() &&
            date.getFullYear() === selectedDateObj.getFullYear()
        );
    }

    // 초기 날짜 설정 및 날짜 변경 시 업데이트
    useEffect(() => {
        setVisibleDates(generateDates());
    }, []);

    // 날짜 라벨 계산 함수
    const getDayLabel = (date: Date) => {
        if (isToday(date)) return '오늘';
        if (isTomorrow(date)) return '내일';
        return (format(date, 'EEE', { locale: ko }) + '요일'); // 요일 표시
    };

    return (
        <div className="w-full bg-[#faf9f9] px-[25px] py-[15px]">
            <div className="flex justify-between items-center self-stretch gap-0">
                {visibleDates.map((date, index) => (
                    <button
                        key={index}
                        onClick={() => handleDateSelect(date)}
                        className={`flex flex-col w-[50px] items-center py-[7px] px-[10px] rounded-md ${
                            isSelected(date)
                                ? 'bg-[#ed3a3a] text-white'
                                : 'bg-transparent text-[#afafaf]'
                        }`}
                    >
                        <div className={`text-[10px] font-bold mb-[-3px]`}>
                            {getDayLabel(date)}
                        </div>
                        <div className="w-[22px] h-[auto] flex items-center text-[18px] font-bold justify-center rounded-full">
                            {format(date, 'd')}
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
};
