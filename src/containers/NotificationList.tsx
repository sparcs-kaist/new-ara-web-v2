//Dumb Component (ArticleList)를 사용하는 모든 component들의 Set입니다.

import React, { useEffect, useState } from 'react';
import NotificationList from '@/components/NotificationList/NotificationList';
import { fetchNotifications } from "@/lib/api/notification";

// 기본적인 Notification List 컴포넌트
export function BasicNotificationList() {
    const [notifications, setNotifications] = useState([]);
    useEffect(() => {
        const fetchData = async () => {
            const response = await fetchNotifications();
            setNotifications(response.results);
        };
        fetchData();
    }, []);

    return (
        <NotificationList
            notifications={notifications}
            showIcon={true}
            showTag={true}
            showDetail={true}
            showReply={true}
            showTimestamp={true}
            iconSize={24}
            verticalSpacing={16}
            detailFontWeight="font-normal"
            detailFontSize="text-xs"
        />
    );
}

// 메인 화면 알림 미리보기 컴포넌트
export function MainPageNotificationPreview() {
    const [notifications, setNotifications] = useState([]);
    const [, setLoading] = useState(true);
    
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const response = await fetchNotifications(); //기본 : 3개만
                setNotifications(response.results);
            } catch (error) {
                console.error('알림을 불러오는 중 오류가 발생했습니다:', error);
            } finally {
                setLoading(false);
            }
        };
        
        fetchData();
    }, []);

    return (
        <NotificationList
            notifications={notifications}
            showIcon={true}
            showTag={false}
            showDetail={false}
            showContent={true}
            showTimestamp={true}
            showReply={false}
            listSpacing={20} // 요청한 listSpacing 값
            contentFontSize="text-sm"
        />
    );
}