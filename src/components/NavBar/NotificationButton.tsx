//@typescript-eslint/no-explicit-any

"use client";
import { useState, useRef, useEffect } from 'react';
import NotiDetail from './NotiDetail';
import Image from 'next/image';
import { fetchNotifications } from "@/lib/api/notification";
import { NotificationApiResponse } from '@/lib/types/notification';

export default function NotificationButton() {
    const [showNoti, setShowNoti] = useState(false);
    const [Notidata, setNotiData] = useState<[]>([]);
    const [hasUnread, setHasUnread] = useState(false);
    const buttonRef = useRef<HTMLDivElement>(null);

    //먼저 데이터 받아오기
    useEffect(() => {
        const fetchData = async () => {
            const response: NotificationApiResponse = await fetchNotifications();
            setNotiData(response.results as unknown as []);
            setHasUnread(Array.isArray(response.results) && response.results.some((n: any) => !n.is_read));
        };
        fetchData();
    }, []);

    const toggleNoti = () => {
        setShowNoti(!showNoti);
    };

    // 버튼 위치에 맞게 알림창 위치 계산
    const getPosition = () => {
        // 기본 위치
        return "right-0";
    };

    return (
        <div className="relative" ref={buttonRef}>
            <div
                className="relative w-[32px] h-[32px] flex items-center justify-center rounded-full hover:bg-gray-100 cursor-pointer"
                onClick={toggleNoti}
            >
                <Image width={17} height={20} src="/notification.svg" alt="notification icon" />
                {hasUnread && (
                    <span
                        className="absolute -top-[0px] -right-[0px] h-1.5 w-1.5 rounded-full bg-red-500"
                        aria-label="unread notifications"
                    />
                )}
            </div>

            {showNoti && <NotiDetail position={getPosition()} NotiData={Notidata} />}
        </div>
    );
}
