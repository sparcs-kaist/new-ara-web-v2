'use client';
import React, { useState } from 'react';
import SmallBoardMyInfo from "../../components/MyInfo/SmallBoardMyInfo";
import MyActivity from "../../components/MyInfo/MyActivity";
import PostSetting from "../../components/MyInfo/PostSetting";
import BlockedUser from "../../components/MyInfo/BlockedUser";
import Profile from "../../components/MyInfo/Profile";
import ArticleList from "../../components/ArticleList/ArticleList"; 
import clsx from 'clsx';

const TABS = ['내가 쓴 글', '최근 본 글', '담아둔 글', '알림'];

const generateItems = (prefix: string, count = 23) =>
  new Array(count).fill(null).map((_, i) => ({
    id: i,
    title: `${prefix} ${i + 1}.jpg`,
    author: "귀요미 엘리지아",
    views: 95 + i,
    likes: 18 + i,
    dislikes: 5,
    comments: 8,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * (i + 1)),
    profileImgUrl: "/images/profile1.jpg",
    thumbnailUrl: "/images/thumb1.jpg",
  }));

const dataMap = {
  '내가 쓴 글': generateItems('내 글'),
  '최근 본 글': generateItems('최근 글'),
  '담아둔 글': generateItems('담은 글'),
  '알림': generateItems('알림'),
};

const ITEMS_PER_PAGE = 10;

const MyInfo = () => {
  const [tab, setTab] = useState('내가 쓴 글');
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const items = dataMap[tab] ?? [];
  const allItems = items.filter(item =>
    item.title.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(allItems.length / ITEMS_PER_PAGE);
  const paginatedItems = allItems.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="flex flex-col lg:flex-row px-[150px] py-8 gap-10">
      {/* 좌측 프로필 + 설정 */}
      <div className="flex flex-col w-full lg:w-[270px] flex-shrink-0 gap-4 items-center">
        <Profile />
        <SmallBoardMyInfo title="활동 기록"><MyActivity /></SmallBoardMyInfo>
        <SmallBoardMyInfo title="설정"><PostSetting /></SmallBoardMyInfo>
        <SmallBoardMyInfo title="차단한 유저"><BlockedUser /></SmallBoardMyInfo>
      </div>

      {/* 우측 게시글 리스트 */}
      <div className="flex flex-col flex-1">
        <div className="flex justify-between items-end mb-6 border-b border-gray-200 pb-3">
          {/* 탭 네비게이션 */}
          <div className="flex gap-8">
            {TABS.map(t => (
              <button
                key={t}
                className={clsx(
                  'pb-2 text-sm font-semibold transition-colors duration-200',
                  tab === t
                    ? 'text-red-600 border-b-2 border-red-600'
                    : 'text-gray-400 hover:text-red-500 border-b-2 border-transparent'
                )}
                onClick={() => {
                  setTab(t);
                  setCurrentPage(1);
                }}
              >
                {t}
              </button>
            ))}
          </div>
          
          {/* 검색창 */}
          <input
            type="text"
            placeholder="🔍 Search"
            className="w-[300px] h-[40px] px-[10px] py-[10px] rounded-[15px] bg-gray-100 text-sm outline-none"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>
        
        {/* 게시글 리스트 */}
        <ArticleList
          posts={paginatedItems}
          showWriter={true}
          showProfile={true}
          showHit={true}
          showStatus={true}
          showAttachment={true}
          showTimeAgo={true}
          pagination={true}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          titleFontSize="text-sm"
          titleFontWeight="font-normal"
          gapBetweenPosts={10}
          gapBetweenTitleAndMeta={6}
        />
      </div>
    </div>
  );
};

export default MyInfo;

