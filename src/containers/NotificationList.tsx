//Dumb Component (ArticleList)를 사용하는 모든 component들의 Set입니다.

import React, { useEffect, useState } from 'react';
import NotificationList from '@/components/NotificationList/NotificationList';
import { fetchNotifications } from "@/lib/api/notification";
import { Notification } from "@/lib/types/notification";

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

// Profile 페이지 - 내가 받은 알림 목록

export function ProfileNotificationList({ search }: { search: string }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    let debounceTimer: NodeJS.Timeout;

    const fetchData = async (searchTerm: string) => {
      try {
        const response = await fetchNotifications(currentPage);

        let filtered = response.results || [];

        if (searchTerm) {
          const lowerSearch = searchTerm.toLowerCase();

          filtered = filtered.filter((n: Notification) => {
            const inArticle = n.related_article?.title?.toLowerCase().includes(lowerSearch);
            const inComment = n.related_comment?.content?.toLowerCase().includes(lowerSearch);
            const inChat =
              n.related_chat_room?.recent_message?.message_content
                ?.toLowerCase()
                .includes(lowerSearch);

            return inArticle || inComment || inChat;
          });
        }

        setNotifications(filtered);
        setTotalPages(response.num_pages || 1);
      } catch (error) {
        console.error("알림을 불러오는 중 오류가 발생했습니다:", error);
      }
    };

    debounceTimer = setTimeout(() => fetchData(search), 300);

    return () => clearTimeout(debounceTimer);
  }, [currentPage, search]);

  const handleItemClick = (notification: Notification) => {
    if (notification.related_article?.id) {
      window.location.href = `/article/${notification.related_article.id}`;
      return;
    }
    if (notification.related_comment?.parent_article) {
      window.location.href = `/article/${notification.related_comment.parent_article}`;
      return;
    }
  };

  return (
    <NotificationList
      notifications={notifications}
      showIcon
      showTag
      showDetail
      showContent
      showReply={false}
      showTimestamp
      iconSize={24}
      verticalSpacing={16}
      detailFontWeight="font-normal"
      detailFontSize="text-sm"
      contentFontSize="text-xs"
      itemClassName="border-b border-gray-200 cursor-pointer hover:bg-gray-50 px-2 py-3 transition-colors duration-100"
      onItemClick={handleItemClick}
      pagination
      currentPage={currentPage}
      totalPages={totalPages}
      onPageChange={setCurrentPage}
    />
  );
}
