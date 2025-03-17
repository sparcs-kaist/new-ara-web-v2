'use client';
import SmallBoardMyInfo from "@/components/SmallBoardMyInfo";
import React from 'react';
import { useTranslation } from 'react-i18next';
import MyActivity from "@/components/MyActivity";
import PostSetting from "@/components/PostSetting";
import BlockedUser from "@/components/BlockedUser";
import Profile from "@/components/Profile";

const MyInfo = () => {
  const { t } = useTranslation();

  return (
    <div>
      <Profile/>
      <SmallBoardMyInfo title='나의 활동 기록'><MyActivity/></SmallBoardMyInfo>
      <SmallBoardMyInfo title='settings-title'><PostSetting/></SmallBoardMyInfo>
      <SmallBoardMyInfo title='blocked-title'><BlockedUser/></SmallBoardMyInfo>
    </div>
  )
};

export default MyInfo;