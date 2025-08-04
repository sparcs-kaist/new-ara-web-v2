'use client';
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import React from 'react';
import { fetchMe, updateUser } from '@/lib/api/user';

interface PostSettingProps {
    onSettingChange?: (settings: { seeSexual: boolean; seeSocial: boolean }) => void;
  }

const PostSetting: React.FC<PostSettingProps> = ({ onSettingChange }) => {
  const { t } = useTranslation();
  const [isSexual, setIsSexual] = useState<boolean>(false);
  const [isSocial, setIsSocial] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userData, setUserData] = useState<any>(null); // 나중에 타입 지정

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchMe();
        setUserData(data);
        setIsSexual(Boolean(data.see_sexual));
        setIsSocial(Boolean(data.see_social));
        setError(null);  // 성공 시 에러 초기화도 명시적으로!
      } catch (e) {
        console.error("fetchMe error:", e);
        setError(t('설정값을 불러오는 데 실패했습니다.'));
      } finally {
        setLoading(false);
      }
    })();
  }, [t]);

  const saveSettings = async (newSexual: boolean, newSocial: boolean) => {
    if (!userData) return;

    try {
      await updateUser(userData.user, {
        nickname: userData.nickname ?? '',
        picture: null, // 혹은 기존 사진 처리
        sexual: newSexual,
        social: newSocial,
      });
      setError(null);
      onSettingChange?.({ seeSexual: newSexual, seeSocial: newSocial });
    } catch {
      setError(t('설정 저장에 실패했습니다.'));
    }
  };

  const toggleSexual = () => {
    const newValue = !isSexual;
    setIsSexual(newValue);
    saveSettings(newValue, isSocial);
  };

  const toggleSocial = () => {
    const newValue = !isSocial;
    setIsSocial(newValue);
    saveSettings(isSexual, newValue);
  };

  if (loading) return <div>{t('로딩 중...')}</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div>
      <div className="p-[10px] w-full">
        <div className="flex justify-between items-center p-[8px] h-[30px]">
          <span className="text-sm">{t('성인글 보기')}</span>
          <div onClick={toggleSexual} className="cursor-pointer flex-shrink-0">
            {isSexual ? (
              <i className="material-icons text-ara_red !text-[30px]">toggle_on</i>
            ) : (
              <i className="material-icons text-gray-400 !text-[30px]">toggle_off</i>
            )}
          </div>
        </div>
        <div className="flex justify-between items-center p-[8px] h-[30px]">
          <span className="text-sm">{t('settings-social')}</span>
          <div onClick={toggleSocial} className="cursor-pointer">
            {isSocial ? (
              <i className="material-icons text-ara_red !text-[30px]">toggle_on</i>
            ) : (
              <i className="material-icons text-gray-400 !text-[30px]">toggle_off</i>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostSetting;
