"use client";

import SearchBar from "@/components/searchBar";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ResponsePost } from "@/lib/types/post";
import { fetchTopArticles, fetchArticles } from "@/lib/api/board";
import { HotPreview, RecentPreview, ToSchoolPreview } from "@/containers/ArticleList";
import MealData from "@/components/Meal/MealData";

export default function Home() {
  const [inputValue, setInputValue] = useState("");
  const [, setHotArticles] = useState<ResponsePost[]>([]);
  const [, setRecentArticles] = useState<ResponsePost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // API에서 데이터 가져오기
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
    <div className="max-w-[1200px] mx-auto">
      <div className="absolute top-0 left-0 w-full h-[400px]  -z-10"></div>
      
      <div className="h-[110px] w-full flex justify-center items-start pt-4">
        <SearchBar
          value={inputValue}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInputValue(e.target.value)}
        />
      </div>

      {/* 실제 메인 페이지 컨텐츠 */}
      <main className="flex flex-col items-center space-y-6 px-4">
        {loading ? (
          <div className="text-center py-8">데이터를 불러오는 중...</div>
        ) : (
          <>
            {/* 지금 핫한 글 */}
            <section className="w-full max-w-[550px] p-4 bg-white rounded-lg shadow-sm">
              <Link href="/board/hot" className="flex items-center space-x-2 mb-[10px]">
                <h2 className="text-[20px] font-semibold">🔥 지금 핫한 글</h2>
                <Image src="/Right_Chevron.svg" width={8.84} height={15} alt="arrow" />
              </Link>
              <HotPreview/>
            </section>

            {/* 방금 올라온 글 */}
            <section className="w-full max-w-[550px] p-4 bg-white rounded-lg shadow-sm">
              <Link href="/board/recent" className="flex items-center space-x-2 mb-[10px]">
                <h2 className="text-[20px] font-semibold">🕑 방금 올라온 글</h2>
                <Image src="/Right_Chevron.svg" width={8.84} height={15} alt="arrow" />
              </Link>
              <RecentPreview />
            </section>

            {/* 오늘의 식단 */}
            <MealData />  

            {/* 학교에게 전합니다. */}
            <section className="w-full max-w-[350px] p-4 bg-white rounded-lg shadow-sm">
              <Link href="/board/recent" className="flex items-center space-x-2 mb-[10px]">
                <h2 className="text-[20px] font-semibold">🏫 학교에게 전합니다</h2>
                <Image src="/Right_Chevron.svg" width={8.84} height={15} alt="arrow" />
              </Link>
              <ToSchoolPreview />
            </section>
          </>
        )}
      </main>
    </div>
  );
}
