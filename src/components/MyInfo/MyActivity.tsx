import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { fetchMe } from '@/lib/api/user';

export function MyActivity() {
  const { t } = useTranslation();

  const [activity, setActivity] = useState({
    postCount: 0,
    commentCount: 0,
    likeCount: 0,
  });

  useEffect(() => {
    const fetchActivityFromMe = async () => {
      try {
        const user = await fetchMe();
        setActivity({
          postCount: user.num_articles || 0,
          commentCount: user.num_comments || 0,
          likeCount: user.num_positive_votes || 0,
        });
      } catch (error) {
        console.error('유저 정보를 불러오는 데 실패했습니다.', error);
      }
    };
    fetchActivityFromMe();
  }, []);

  return (
    <div className="grid grid-cols-3 w-full text-center border rounded-lg py-4 mb-6 bg-white shadow-sm">
      <div className="flex flex-col">
        <div className="text-sm text-gray-600">{t('ranking-posts')}</div>
        <div className="text-lg font-semibold">
          {t('ranking-posts-count', { count: activity.postCount })}
        </div>
      </div>
      <div className="flex flex-col border-l border-gray-200">
        <div className="text-sm text-gray-600">{t('ranking-comments')}</div>
        <div className="text-lg font-semibold">
          {t('ranking-comments-count', { count: activity.commentCount })}
        </div>
      </div>
      <div className="flex flex-col border-l border-gray-200">
        <div className="text-sm text-gray-600">{t('ranking-likes')}</div>
        <div className="text-lg font-semibold">
          {t('ranking-likes-count', { count: activity.likeCount })}
        </div>
      </div>
    </div>
  );
}
