'use client';
import SmallBoard_m from "@/components/SmallBoard_m";
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Image from "next/image";

const MyInfo = () => {
  const { t } = useTranslation();

  const [sexual, setSexual] = useState(false);
  const [social, setSocial] = useState(false);
  const updateSexual = () => {
    setSexual((prev) => !prev);
  };
  const updateSocial = () => {
    setSocial((prev) => !prev);
  };

  const deleteBlockedUser = () => {
  };

  return (
    <div>

      <SmallBoard_m title='나의 활동 기록'>
        <div className="grid grid-cols-3 w-full text-center"> 
          <div className="flex flex-col">
            <div className="text-xs my-2">{t('게시글')}</div>
            <div className="text-lg mb-2">{(t('ranking-posts-count'), "1개")}</div>
          </div>
          <div className="flex flex-col border-l border-gray-400">
            <div className="text-xs my-2">{t('comments')}</div>
            <div className="text-lg mb-2">{(t('ranking-comments-count'), 2)}</div>
          </div>
          <div className="flex flex flex-col border-l border-gray-400">
            <div className="text-xs my-2">{t('likes')}</div>
            <div className="text-lg mb-2">{(t('ranking-likes-count'), 3)}</div>
          </div>
        </div>
      </SmallBoard_m>

      <SmallBoard_m title='settings-title'>
        <div className="p-[10px] w-full">
          <div className="flex justify-between items-center p-[8px] h-[30px]">
            <span className="text-xs">{t('성인글 보기')}</span>
            <div onClick={updateSexual} className="cursor-pointer flex-shrink-0">
              {sexual ? (
                <i className="material-icons text-ara_red !text-[30px]">toggle_on</i>
              ) : (
                <i className="material-icons text-gray-400 !text-[30px]">toggle_off</i>
              )}
            </div>
          </div>
          <div className="flex justify-between items-center p-[8px] h-[30px]">
            <span className="text-xs">{t('settings-social')}</span>
            <div onClick={updateSocial} className="cursor-pointer">
              {social ? (
                <i className="material-icons text-ara_red !text-[30px]">toggle_on</i>
              ) : (
                <i className="material-icons text-gray-400 !text-[30px]">toggle_off</i>
              )}
            </div>
          </div>
        </div>
      </SmallBoard_m>

      <SmallBoard_m title='blocked-title'>
        <ul className="px-2 py-0 text-xs w-full">
          <li>
            <div className="flex flex-row items-center justify-center my-[10px]">
              <Image src="/user.png" width={32} height={32} className="mr-[0.5rem] object-cover rounded-full" alt="Blocked User Image"/>
              <span className="truncate">환호하는 고구마_ab12</span>
              <a onClick={deleteBlockedUser} className="ml-auto flex items-center justify-center cursor-pointer">
                <i className="material-icons h-[2rem] !leading-[2rem]">close</i>
              </a>
            </div>
          </li>
          <li>
            <div className="flex flex-row items-center justify-center my-[10px]">
              <Image src="/user.png" width={32} height={32} className="mr-[0.5rem] object-cover rounded-full" alt="Blocked User Image"/>
              <span className="truncate">nickname</span>
              <a onClick={deleteBlockedUser} className="ml-auto flex items-center justify-center cursor-pointer">
                <i className=" material-icons h-[2rem] !leading-[2rem]">close</i>
              </a>
            </div>
          </li>
        </ul>
        <div className="p-[10px] text-[12px]">{t('차단한 유저가 없습니다.')}</div>
      </SmallBoard_m>
    </div>
  )
};

export default MyInfo;