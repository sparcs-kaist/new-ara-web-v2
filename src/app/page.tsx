"use client";

import SearchBar from "@/components/searchBar";
import ArticleList from "@/components/ArticleList/ArticleList";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

export default function Home() {
  const [inputValue, setInputValue] = useState("");

  // 홈페이지에서 사용할 Mock 데이터
  const hotArticles = [
    { id: 1, title: "SPARCS 정기 모집", author: "운영진", timeAgo: "1일 전", likes: 150, dislikes: 1, comments: 25, boardName: "공지", hasAttachment: true, hit: 1024 },
    { id: 2, title: "딸기 파티에 초대합니다!", author: "딸기수호대", timeAgo: "5시간 전", likes: 99, dislikes: 5, comments: 32, boardName: "자유", hasAttachment: true, hit: 876 },
    { id: 3, title: "새로운 아라 디자인 피드백 받습니다", author: "개발팀", timeAgo: "2일 전", likes: 85, dislikes: 2, comments: 41, boardName: "개발", hasAttachment: false, hit: 950 },
  ];

  const recentArticles = [
    { id: 4, title: "오늘 점심 메뉴 추천", author: "점심봇", timeAgo: "5분 전", likes: 2, dislikes: 0, comments: 1, boardName: "자유", hasAttachment: false, hit: 15 },
    { id: 5, title: "분실물 찾아가세요 (검은색 에어팟 프로)", author: "학생회", timeAgo: "30분 전", likes: 5, dislikes: 0, comments: 2, boardName: "공지", hasAttachment: true, hit: 55 },
    { id: 6, title: "프로그래밍 스터디원 구합니다", author: "코딩고수", timeAgo: "1시간 전", likes: 10, dislikes: 0, comments: 3, boardName: "스터디", hasAttachment: false, hit: 88 },
  ];

  return (
    <div className="max-w-[1200px] mx-auto">
      <div className="absolute top-0 left-0 w-full h-[400px] bg-gradient-to-b from-[#FFEDD2] to-[#FFFFFF] -z-10"></div>
      
      <div className="h-[220px] w-full flex justify-center items-center">
        <SearchBar
          value={inputValue}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInputValue(e.target.value)}
        />
      </div>

      {/* 실제 메인 페이지 컨텐츠 */}
      <main className="flex flex-col items-center space-y-6 px-4">
        {/* HOT 게시물 */}
        <section className="w-full max-w-[550px] p-4 bg-white rounded-lg shadow-sm">
          <Link href="/board/hot" className="flex items-center space-x-2 mb-[10px]">
            <h2 className="text-[20px] font-semibold">HOT 게시물</h2>
            <Image src="/Right_Chevron.svg" width={8.84} height={15} alt="arrow" />
          </Link>
          <ArticleList posts={hotArticles} showRank={true} showBoard={true} />
        </section>

        {/* 최신 글 */}
        <section className="w-full max-w-[550px] p-4 bg-white rounded-lg shadow-sm">
          <Link href="/board/recent" className="flex items-center space-x-2 mb-[10px]">
            <h2 className="text-[20px] font-semibold">최신 글</h2>
            <Image src="/Right_Chevron.svg" width={8.84} height={15} alt="arrow" />
          </Link>
          <ArticleList posts={recentArticles} showBoard={true} />
        </section>
      </main>
    </div>
  );
}
