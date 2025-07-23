//Dumb Component (ArticleList)를 사용하는 모든 component들의 Set입니다.

import React, { useEffect, useState, useRef } from 'react';
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