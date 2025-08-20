"use client";

import SearchBar from "@/components/searchBar";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ResponsePost } from "@/lib/types/post";
import { fetchTopArticles, fetchArticles } from "@/lib/api/board";
import { HotPreview, RecentPreview, ToSchoolPreview } from "@/containers/ArticleList";
import SmallMyInfo from '@/components/SmallMyinfo/SmallMyInfo';
import MyChatRooms from '@/components/MyChatRoom/MyChatRooms';
import MarketPreview from "@/components/MarketPreview/MarketPreview";
import PosterCarousel from "@/components/PosterPreview/PosterCarousel";

export default function Home() {
  const [inputValue, setInputValue] = useState("");
  const router = useRouter();
  const [, setHotArticles] = useState<ResponsePost[]>([]);
  const [, setRecentArticles] = useState<ResponsePost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const hotResponse = await fetchTopArticles({ pageSize: 3 });
        const recentResponse = await fetchArticles({ pageSize: 3, ordering: '-created_at' });

        setHotArticles(hotResponse.results);
        setRecentArticles(recentResponse.results);
      } catch (error) {
        console.error("Error fetching articles:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="max-w-[1280px] mx-auto">
      {/* 상단 그라데이션 배경 적용 */}
      <div className="absolute top-0 left-0 w-full h-[300px] -z-10 bg-gradient-to-b from-[#fcefef] to-white"></div>

      <div className="h-[110px] w-full flex justify-center items-center pt-4 relative">
        <form
          className="w-full max-w-[600px] mx-auto flex justify-center"
          onSubmit={e => {
            e.preventDefault();
            if (inputValue.trim()) {
              // board로 검색 라우팅 (검색어 보존)
              router.push(`/board?search=${encodeURIComponent(inputValue.trim())}`);
            } else {
              router.push("/board");
            }
          }}
        >
          <SearchBar
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
          />
        </form>
      </div>

      {/* 실제 메인 페이지 컨텐츠 */}
      <main className="flex gap-4 px-1">
        {loading ? (
          <div className="text-center py-8 w-full">데이터를 불러오는 중...</div>
        ) : (
          <>
            {/* 왼쪽 영역 (비율 조정된 그리드 구조) */}
            <div className="w-[70%] grid grid-cols-10 gap-3 auto-rows-auto"> {/* 10열 그리드로 변경 */}
              {/* 1행 1열: 지금 핫한 글 (약간 줄어듦) */}
              <section className="col-span-6 w-full p-4 bg-white rounded-[16px] shadow border border-gray-200 main-page-block-shadow"> {/* 3/5 너비 */}
                <Link href="/board/hot" className="flex items-center space-x-2 mb-[10px]">
                  <h2 className="text-[20px] font-bold">🔥 지금 핫한 글</h2>
                  <Image src="/Right_Chevron.svg" width={8.84} height={15} alt="arrow" />
                </Link>
                <HotPreview />
              </section>

              {/* 1행 2열: 학교에게 전합니다 (넓어짐) */}
              <section className="col-span-4 w-full p-3 bg-white rounded-[16px] shadow border border-gray-200 main-page-block-shadow"> {/* 2/5 너비 */}
                <Link href="/board/school" className="flex items-center space-x-2 mb-[10px]">
                  <h2 className="text-[20px] font-bold">🏫 학교에게 전합니다</h2>
                  <Image src="/Right_Chevron.svg" width={8.84} height={15} alt="arrow" />
                </Link>
                <ToSchoolPreview />
              </section>

              {/* 2행 1열: 장터 (넓어짐) */}
              <section className="col-span-5 w-full p-3 bg-white rounded-[16px] shadow border border-gray-200 main-page-block-shadow"> {/* 1/2 너비 */}
                <Link href="/board/market" className="flex items-center space-x-2 mb-[10px]">
                  <h2 className="text-[20px] font-bold">🛍️ 장터</h2>
                  <Image src="/Right_Chevron.svg" width={8.84} height={15} alt="arrow" />
                </Link>
                <MarketPreview />
              </section>

              {/* 2행 2열: 방금 올라온 글 (약간 줄어듦) */}
              <section className="col-span-5 w-full p-4 bg-white rounded-[16px] shadow border border-gray-200 main-page-block-shadow"> {/* 1/2 너비 */}
                <Link href="/board/recent" className="flex items-center space-x-2 mb-[10px]">
                  <h2 className="text-[20px] font-bold">🕑 방금 올라온 글</h2>
                  <Image src="/Right_Chevron.svg" width={8.84} height={15} alt="arrow" />
                </Link>
                <RecentPreview />
              </section>

              {/* 3행: 포스터 - 전체 10열 span */}
              <section className="col-span-10 w-full p-4 bg-white rounded-[16px] shadow border border-gray-200 main-page-block-shadow">
                <PosterCarousel />
              </section>
            </div>

            {/* 오른쪽 영역 (세로로 배치된 컴포넌트) */}
            <div className="w-[30%] flex flex-col gap-4">
              {/* 미니 프로필 정보 */}
              <SmallMyInfo />

              {/* 나의 채팅방 */}
              <MyChatRooms />

              {/* 오늘의 식단 - 높이 확장 */}
              {/*
              <div className="flex-grow">
                <MealData />
              </div>
              */}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
