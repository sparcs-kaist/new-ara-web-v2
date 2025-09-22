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
import SparcsNotice from "@/components/SparcsNotice/SparcsNotice";

export default function Home() {
  const [inputValue, setInputValue] = useState("");
  const router = useRouter();
  const [, setHotArticles] = useState<ResponsePost[]>([]);
  const [, setRecentArticles] = useState<ResponsePost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [hotResponse, recentResponse] = await Promise.all([
          fetchTopArticles({ pageSize: 3 }),
          fetchArticles({ pageSize: 3, ordering: '-created_at' })
        ]);

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

      <div className="h-[110px] w-full flex justify-center items-center pb-4 relative">
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

      {/* 실제 메인 페이지 컨텐츠 - Grid 레이아웃, 좌우 여백(padding) 추가 */}
      <main className="grid grid-cols-10 gap-3 xl:px-1 md:px-16 sm:px-12 xs:px-8 px-4">
        {loading ? (
          <div className="col-span-10 text-center py-8">데이터를 불러오는 중...</div>
        ) : (
          <>
            {/* --- 상단 왼쪽 영역 (1, 2행) --- */}
            <div className="col-span-10 xl:col-span-7 flex flex-col gap-3">
              {/* 1행: lg 이하는 세로, lg 이상은 가로 그리드 */}
              <div className="flex flex-col lg:grid lg:grid-cols-10 gap-3">
                <section className="lg:col-span-6 w-full p-4 bg-white rounded-[16px] shadow border border-gray-200 main-page-block-shadow">
                  <Link href="/board?board=popular" className="flex items-center space-x-2 mb-[10px]">
                    <h2 className="text-[20px] font-bold">🔥 지금 핫한 글</h2>
                    <Image src="/Right_Chevron.svg" width={8.84} height={15} alt="arrow" />
                  </Link>
                  <HotPreview />
                </section>
                <section className="lg:col-span-4 w-full p-3 bg-white rounded-[16px] shadow border border-gray-200 main-page-block-shadow">
                  <Link href="/board?board=with-school" className="flex items-center space-x-2 mb-[10px]">
                    <h2 className="text-[20px] font-bold">🏫 학교에게 전합니다</h2>
                    <Image src="/Right_Chevron.svg" width={8.84} height={15} alt="arrow" />
                  </Link>
                  <ToSchoolPreview />
                </section>
              </div>
              {/* 2행: lg 이하는 세로, lg 이상은 가로 그리드 */}
              <div className="flex flex-col lg:grid lg:grid-cols-10 gap-3">
                <section className="lg:col-span-5 w-full p-3 bg-white rounded-[16px] shadow border border-gray-200 main-page-block-shadow">
                  <Link href="/board?board=market" className="flex items-center space-x-2 mb-[10px]">
                    <h2 className="text-[20px] font-bold">🛍️ 장터</h2>
                    <Image src="/Right_Chevron.svg" width={8.84} height={15} alt="arrow" />
                  </Link>
                  <MarketPreview />
                </section>
                <section className="lg:col-span-5 w-full p-4 bg-white rounded-[16px] shadow border border-gray-200 main-page-block-shadow">
                  <Link href="/board" className="flex items-center space-x-2 mb-[10px]">
                    <h2 className="text-[20px] font-bold">🕑 방금 올라온 글</h2>
                    <Image src="/Right_Chevron.svg" width={8.84} height={15} alt="arrow" />
                  </Link>
                  <RecentPreview />
                </section>
              </div>
            </div>

            {/* --- 상단 오른쪽 영역 (내 정보, 채팅방) --- */}
            {/* xl보다 작아지면 숨김 */}
            <div className="hidden xl:flex col-span-3 flex-col gap-3">
              <SmallMyInfo />
              <MyChatRooms /> {/* flex-1 속성으로 남은 공간을 모두 채움 */}
            </div>

            {/* --- 하단 왼쪽 영역 (포스터) --- */}
            {/* xl보다 작아지면 전체 너비 차지 */}
            <section className="col-span-10 xl:col-span-7 w-full p-4 bg-white rounded-[16px] shadow border border-gray-200 main-page-block-shadow">
              <PosterCarousel />
            </section>

            {/* --- 하단 오른쪽 영역 (SPARCS 공지) --- */}
            {/* xl보다 작아지면 숨김 */}
            <div className="hidden xl:flex col-span-3">
              <SparcsNotice className="h-full w-full" />
            </div>
          </>
        )}
      </main>
      {/* 포스터는 왼쪽 그리드 내부 3행에 배치됨 */}
    </div>
  );
}
