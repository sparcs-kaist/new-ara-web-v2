// 학식 기능 날짜 설정을 위한 컴포넌트
'use client'

import { useState, useEffect } from 'react';
import { format, addDays, subDays } from 'date-fns';
import { ko } from 'date-fns/locale';

export default function DateNavigator() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [visibleDates, setVisibleDates] = useState<Date[]>([]);
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());

    // 날짜 표시를 위한 함수
    const generateDates = (baseDate: Date) => {
        const dates = [];
        // 오늘 포함해서 7일 표시
        for (let i = 0; i < 7; i++) {
            dates.push(addDays(baseDate, i));
        }
        return dates;
    };

    // 날짜 선택 핸들러
    const handleDateSelect = (date: Date) => {
        setSelectedDate(date);
        // 여기에 날짜 선택 시 수행할 작업 추가
    };

    // 날짜가 오늘인지 확인하는 함수
    const isToday = (date: Date) => {
        const today = new Date();
        return (
            date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear()
        );
    };

    const isTomorrow = (date : Date) => {
        const tomorrow = addDays(new Date(), 1);
        return (
            date.getDate() === tomorrow.getDate() &&
            date.getMonth() === tomorrow.getMonth() &&
            date.getFullYear() === tomorrow.getFullYear()
        );
    }

    // 초기 날짜 설정
    useEffect(() => {
        setVisibleDates(generateDates(currentDate));
    }, [currentDate]);

    const getDayLabel = (date: Date) => {
        if (isToday(date)) return '오늘';
        if (isTomorrow(date)) return '내일';
        return (format(date, 'EEE', { locale: ko }) + '요일'); //요일 표시
    };

    return (
        <div className="w-full bg-[#faf9f9] px-[25px] py-[15px]">
            <div className="flex justify-between items-center self-stretch gap-0">
                {visibleDates.map((date, index) => (
                    <button
                        key={index}
                        onClick={() => handleDateSelect(date)}
                        className={`flex flex-col w-[50px] items-center py-[7px] px-[10px] rounded-md ${
                            selectedDate && 
                            selectedDate.getDate() === date.getDate() && 
                            selectedDate.getMonth() === date.getMonth()
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
