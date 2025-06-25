"use client";

import SearchBar from "@/components/searchBar";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ResponsePost } from "@/lib/types/post";
import { fetchTopArticles, fetchArticles } from "@/lib/api/board";
import { HotPreview, RecentPreview, ToSchoolPreview } from "@/containers/ArticleList";
import MealData from "@/components/Meal/MealData";
import OtherServices from "@/components/UserMenu/OtherServices";

export default function Home() {
  const [inputValue, setInputValue] = useState("");
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
    <div className="max-w-[1280px] mx-auto"> {/* 최대 너비 추가 증가 */}
      {/* 상단 그라데이션 배경 적용 */}
      <div className="absolute top-0 left-0 w-full h-[400px] -z-10 bg-gradient-to-b from-[#fcefef] to-white"></div>
      
      <div className="h-[110px] w-full flex justify-center items-start pt-4">
        <SearchBar
          value={inputValue}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInputValue(e.target.value)}
        />
      </div>

      {/* 실제 메인 페이지 컨텐츠 */}
      <main className="flex gap-4 px-1"> {/* 패딩, 갭 추가 감소 */}
        {loading ? (
          <div className="text-center py-8 w-full">데이터를 불러오는 중...</div>
        ) : (
          <>
            {/* 왼쪽 영역 (비율 조정된 그리드 구조) */}
            <div className="w-[70%] grid grid-cols-5 gap-3 auto-rows-auto"> {/* 5열 그리드로 변경 */}
              {/* 1행 1열: 지금 핫한 글 (약간 줄어듦) */}
              <section className="col-span-3 w-full p-4 bg-white rounded-lg shadow"> {/* 3/5 너비 */}
                <Link href="/board/hot" className="flex items-center space-x-2 mb-[10px]">
                  <h2 className="text-[20px] font-semibold">🔥 지금 핫한 글</h2>
                  <Image src="/Right_Chevron.svg" width={8.84} height={15} alt="arrow" />
                </Link>
                <HotPreview/>
              </section>

              {/* 1행 2열: 학교에게 전합니다 (넓어짐) */}
              <section className="col-span-2 w-full p-3 bg-white rounded-lg shadow"> {/* 2/5 너비 */}
                <Link href="/board/school" className="flex items-center space-x-2 mb-[10px]">
                  <h2 className="text-[20px] font-semibold">🏫 학교에게 전합니다</h2>
                  <Image src="/Right_Chevron.svg" width={8.84} height={15} alt="arrow" />
                </Link>
                <ToSchoolPreview />
              </section>

              {/* 2행 1열: 나의 시간표 (넓어짐) */}
              <section className="col-span-2 w-full p-3 bg-white rounded-lg shadow"> {/* 2/5 너비 */}
                <Link href="/timetable" className="flex items-center space-x-2 mb-[10px]">
                  <h2 className="text-[20px] font-semibold">📆 나의 시간표</h2>
                  <Image src="/Right_Chevron.svg" width={8.84} height={15} alt="arrow" />
                </Link>
                <div className="h-[180px] flex items-center justify-center text-gray-500">
                  시간표 미리보기
                </div>
              </section>

              {/* 2행 2열: 방금 올라온 글 (약간 줄어듦) */}
              <section className="col-span-3 w-full p-4 bg-white rounded-lg shadow"> {/* 3/5 너비 */}
                <Link href="/board/recent" className="flex items-center space-x-2 mb-[10px]">
                  <h2 className="text-[20px] font-semibold">🕑 방금 올라온 글</h2>
                  <Image src="/Right_Chevron.svg" width={8.84} height={15} alt="arrow" />
                </Link>
                <RecentPreview />
              </section>
            </div>

            {/* 오른쪽 영역 (세로로 배치된 컴포넌트) */}
            <div className="w-[30%] flex flex-col gap-4"> {/* 너비 추가 감소, 갭 추가 감소 */}
              {/* 기타 서비스 */}
              <div>
                <OtherServices />
              </div>

              {/* 오늘의 식단 - 높이 확장 */}
              <div className="flex-grow">
                <MealData />
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
