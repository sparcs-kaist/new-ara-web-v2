"use client";
import { useState, useRef } from 'react';
import NotiDetail from './NotiDetail';
import Image from 'next/image';

export default function NotificationButton() {
    const [showNoti, setShowNoti] = useState(false);
    const buttonRef = useRef<HTMLDivElement>(null);

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
                className="w-[32px] h-[32px] flex items-center justify-center rounded-full hover:bg-gray-100 cursor-pointer"
                onClick={toggleNoti}
            >
                <Image width={17} height={20} src="/notification.svg" alt="notification icon" />
            </div>
            
            {showNoti && <NotiDetail position={getPosition()} />}
        </div>
    );
}
