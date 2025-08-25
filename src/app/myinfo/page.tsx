'use client';
import React, { useState } from 'react';
import SmallBoardMyInfo from "../../components/MyInfo/SmallBoardMyInfo";
import { MyActivity } from "../../components/MyInfo/MyActivity";
import PostSetting from "../../components/MyInfo/PostSetting";
import BlockedUser from "../../components/MyInfo/BlockedUser";
import Profile from "../../components/MyInfo/Profile";
import { ProfileRecentArticleList } from "../../containers/ArticleList"
import { ProfileBookmarkedArticlesList } from "../../containers/ArticleList";
import { ProfileMyArticleList } from "../../containers/ArticleList";
import { ProfileNotificationList } from "../../containers/NotificationList";


import clsx from 'clsx';

const TABS = ['내가 쓴 글', '최근 본 글', '담아둔 글', '알림'] as const;
type TabType = typeof TABS[number];

const MyInfo = () => {
  const [tab, setTab] = useState<TabType>('내가 쓴 글');
  const [pages, setPages] = useState<Record<TabType, number>>({
    '내가 쓴 글': 1,
    '최근 본 글': 1,
    '담아둔 글': 1,
    '알림': 1,
  });

  const [searches, setSearches] = useState<Record<TabType, string>>({
    '내가 쓴 글': '',
    '최근 본 글': '',
    '담아둔 글': '',
    '알림': '',
  });

  const [filters, setFilters] = useState({
    seeSexual: false,
    seeSocial: false,
  });

  const handleSearchChange = (newSearch: string) => {
    setSearches(prev => ({ ...prev, [tab]: newSearch }));
    setPages(prev => ({ ...prev, [tab]: 1 }));
  };

  const currentSearch = searches[tab];
  
  return (
      <div className="flex flex-row gap-[48px] px-4 sm:px-6 md:px-10 lg:px-[150px] py-4 items-start">
        {/* 좌측 프로필 + 설정 */}
        <div className="flex flex-col w-[250px] sm:w-[270px] lg:w-[270px] flex-shrink gap-4 items-start">
          <Profile />
          <SmallBoardMyInfo title="활동 기록"><MyActivity /></SmallBoardMyInfo>
          <SmallBoardMyInfo title="설정"><PostSetting onSettingChange={setFilters} /></SmallBoardMyInfo>
          <SmallBoardMyInfo title="차단한 유저"><BlockedUser /></SmallBoardMyInfo>
        </div>
    
        {/* 우측 게시글 리스트 */}
        <div className="flex flex-col flex-1 min-w-0">
          <div className="flex flex-row justify-between items-center gap-2 border-b border-gray-200 pb-3 mt-4">
            {/* 탭 네비게이션 */}
            <div className="relative flex gap-6 overflow-x-auto flex-nowrap flex-1 min-w-0">
              {TABS.map(t => (
                <button
                  key={t}
                  className={clsx(
                    "relative pb-2 text-sm font-semibold whitespace-nowrap transition-colors duration-200",
                    tab === t ? "text-red-600" : "text-black hover:text-red-500"
                  )}
                  onClick={() => setTab(t)}
                >
                  {t}
                  {tab === t && (
                    <div className="absolute left-1/2 -bottom-[2px] -translate-x-1/2 w-[20px] h-[3px] rounded bg-[#ED3A3A]" />
                  )}
                </button>
              ))}
            </div>
    
            {/* 검색창 */}
            <div className="flex-shrink-0 w-[200px] sm:w-[250px] md:w-[300px]">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search"
                  className="w-full h-[40px] pl-10 pr-3 rounded-[12px] bg-gray-100 text-sm outline-none"
                  value={currentSearch}
                  onChange={(e) => handleSearchChange(e.target.value)}
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                  <svg width="16" height="16" fill="none" viewBox="0 0 16 16">
                    <path
                      d="M11.5 11.5L15 15M7 12A5 5 0 1 1 7 2a5 5 0 0 1 0 10Z"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
              </div>
            </div>
          </div>
    
          <div>
            {tab === "내가 쓴 글" && <ProfileMyArticleList filters={filters} search={currentSearch} />}
            {tab === "최근 본 글" && <ProfileRecentArticleList filters={filters} search={currentSearch} />}
            {tab === "담아둔 글" && <ProfileBookmarkedArticlesList filters={filters} search={currentSearch} />}
            {tab === "알림" && <ProfileNotificationList search={currentSearch} />}
          </div>
        </div>
      </div>
    );
    
  };
  
  export default MyInfo;
  

