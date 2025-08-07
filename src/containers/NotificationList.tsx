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

// 프로필 페이지에서 사용하는 알림 목록// Profile 페이지 - 내가 받은 알림 목록
export function ProfileNotificationList() {
  const [notifications, setNotifications] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetchNotifications(currentPage);

        setNotifications(response.results || []);
        setTotalPages(response.num_pages || 1);
      } catch (error) {
        console.error('알림을 불러오는 중 오류가 발생했습니다:', error);
      }
    };

    fetchData();
  }, [currentPage]);

  const handleItemClick = (notification: any) => {
    if (notification.article_id) {
      window.location.href = `/article/${notification.article_id}`;
    }
  };

  return (
    <NotificationList
      notifications={notifications}
      showIcon={true}
      showTag={true}
      showDetail={true}
      showContent={true}
      showReply={false}
      showTimestamp={true}
      iconSize={24}
      verticalSpacing={16}
      detailFontWeight="font-normal"
      detailFontSize="text-sm"
      contentFontSize="text-xs"
      itemClassName="border-b border-gray-200 cursor-pointer hover:bg-gray-50 px-2 py-3 transition-colors duration-100"
      onItemClick={handleItemClick}
      pagination={true}
      currentPage={currentPage}
      totalPages={totalPages}
      onPageChange={setCurrentPage}
    />
  );
}
