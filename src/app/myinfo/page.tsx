'use client';
import SmallBoardMyInfo from "@/components/SmallBoardMyInfo";
import React from 'react';
import { useTranslation } from 'react-i18next';
import MyActivity from "@/components/MyActivity";
import PostSetting from "@/components/PostSetting";
import BlockedUser from "@/components/BlockedUser";
import Profile from "@/components/Profile";

const MyInfo = () => {
  useTranslation();

  return (
    <div className="flex-shrink-0 pl-[146px]">
      <div className="flex flex-col self-center w-[270px]">
        <Profile/>
      </div>
      <div className="flex flex-col items-center w-[270px]">
        <SmallBoardMyInfo title='나의 활동 기록'><MyActivity/></SmallBoardMyInfo>
        <SmallBoardMyInfo title='settings-title'><PostSetting/></SmallBoardMyInfo>
        <SmallBoardMyInfo title='blocked-title'><BlockedUser/></SmallBoardMyInfo>
      </div>
    </div>
  )
};

export default MyInfo;