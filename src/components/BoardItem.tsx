export default function Test() {
    return (
      <div>
        <h1>Build Test 통과용</h1>
      </div>
    );
  }
  
/*
'use client';
import React, { useState } from 'react';
import SmallBoardMyInfo from "@/components/SmallBoardMyInfo";
import MyActivity from "@/components/MyActivity";
import PostSetting from "@/components/PostSetting";
import BlockedUser from "@/components/BlockedUser";
import Profile from "@/components/Profile";
import BoardItem from "@/components/BoardItem";
import clsx from 'clsx';

const TABS = ['내가 쓴 글', '최근 본 글', '담아둔 글'] as const;

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
} as const;

const ITEMS_PER_PAGE = 10;

const MyInfo = () => {
  const [tab, setTab] = useState('내 글');
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const allItems = dataMap['내가 쓴 글'].filter(item =>
    item.title.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(allItems.length / ITEMS_PER_PAGE);
  const paginatedItems = allItems.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="flex flex-col lg:flex-row pl-4 pr-4 lg:pl-[146px] py-8 gap-10">
      <div className="flex flex-col w-full lg:w-[270px] flex-shrink-0 gap-4 items-center">
        <Profile />
        <SmallBoardMyInfo title="활동 기록"><MyActivity /></SmallBoardMyInfo>
        <SmallBoardMyInfo title="설정"><PostSetting /></SmallBoardMyInfo>
        <SmallBoardMyInfo title="차단한 유저"><BlockedUser /></SmallBoardMyInfo>
      </div>

      <div className="flex flex-col flex-1">
        <div className="flex justify-between items-center mb-4">
          <div className="flex gap-6 border-b pb-2 text-base font-semibold">
            {TABS.map(t => (
              <button
                key={t}
                className={clsx(
                  'pb-1 border-b-2',
                  tab === t ? 'text-pink-500 border-pink-500' : 'text-gray-400 border-transparent'
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
          <input
            type="text"
            placeholder="Search"
            className="border px-3 py-1 rounded text-sm w-64"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>

        <div className="flex flex-col gap-2">
          {paginatedItems.map(item => (
            <BoardItem
              key={`${tab}-${item.id}`}
              {...item}
              createdAt={item.createdAt.toLocaleString('ko-KR', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
              })}
              showThumbnailBehindProfile={true}
            />
          ))}
        </div>

        <div className="flex justify-center mt-6 gap-2 text-sm">
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              className={clsx(
                'w-8 h-8 rounded',
                currentPage === i + 1 ? 'text-red-500 font-bold' : 'text-gray-500'
              )}
              onClick={() => setCurrentPage(i + 1)}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MyInfo;
*/