/* eslint-disable */

import React, { useState, useMemo } from "react";
import ArticleList from "@/components/ArticleList/ArticleList";
import {
  fetchTopArticles,
  fetchArticles,
  fetchAllArticlesExcludingPortalNotice,
  useArticles,
  fetchCourseArticles,
  fetchMajorArticles,
} from "@/lib/api/board";
import { fetchRecentViewedPosts, fetchArchives } from "@/lib/api/board";
import { fetchUserPosts } from "@/lib/api/user_profile";
import { useMe } from "@/lib/query/user";
import { GridArticleList } from "@/components/ArticleList/GridArticleList";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";

//메인 페이지 - 지금 핫한 글
export function HotPreview() {
  const { data: posts = [] } = useQuery({
    queryKey: ["home", "hot"],
    queryFn: async () => (await fetchTopArticles({ pageSize: 3 })).results,
    staleTime: 30_000,
  });
  return (
    <ArticleList
      posts={posts}
      showRank={true}
      showWriter={true}
      showTimeAgo={true}
      showStatus={true}
      showAttachment={true}
      titleFontSize="text-[16px]"
    ></ArticleList>
  );
}

//메인 페이지 - 방금 올라온 글
// 포탈 공지(board id 1) 제외 — 운영진 공지가 사용자 글을 묻는 걸 막기 위함.
export function RecentPreview() {
  const { data: posts = [] } = useQuery({
    queryKey: ["home", "recent"],
    queryFn: async () =>
      (await fetchAllArticlesExcludingPortalNotice({ pageSize: 3, ordering: "-created_at" })).results,
    staleTime: 30_000,
  });
  return (
    <ArticleList
      posts={posts}
      showBoard={true}
      showTimeAgo={true}
      showAttachment={true}
      showProfile={true}
      showWriter={true}
      titleFontSize="text-[16px]"
    ></ArticleList>
  );
}

//메인 페이지 - 학교에게 전합니다.
export function ToSchoolPreview() {
  const { data: posts = [] } = useQuery({
    queryKey: ["home", "toSchool"],
    queryFn: async () => (await fetchArticles({ pageSize: 3, boardId: 14 })).results,
    staleTime: 30_000,
  });
  return (
    <ArticleList
      posts={posts}
      showTimeAgo={true}
      showAnswerStatus={true}
      showStatus={true}
      titleFontSize="text-[16px]"
    />
  );
}

//메인 페이지 - 포탈 공지
export function PortalNoticePreview() {
  return;
}

export interface BoardArticleListProps {
  boardId?: number;
  pageSize?: number;
  topicId?: number;
  query?: string; // 검색어 prop 추가
  hidePortalNotice?: boolean;
  dateType?: "relative" | "absolute";
}

// 🔸 Board 페이지 - 일반 게시글
export function BoardArticleList({
  boardId = 7,
  pageSize = 10,
  topicId,
  query,
  dateType = "relative",
}: BoardArticleListProps) {
  const searchParams = useSearchParams();
  const currentPage = Number(searchParams.get("page")) || 1;
  const router = useRouter();

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", page.toString());

    router.push(`?${params.toString()}`, { scroll: false });
  };

  // useArticles(staleTime 포함)를 쓴다. 글 작성/삭제 시 invalidateArticleQueries로 갱신된다.
  const { data } = useArticles({ pageSize, boardId, page: currentPage, topicId, query });
  const posts = data?.results || [];
  const totalPages = data?.num_pages || 1;
  return (
    <ArticleList
      posts={posts}
      showTimeAgo={true}
      showProfile={true}
      showWriter={true}
      showStatus={true}
      showAnswerStatus={true}
      showHit={true}
      titleFontSize="text-[16px]"
      showTopic={true}
      pagination={true}
      currentPage={currentPage}
      totalPages={totalPages}
      onPageChange={handlePageChange}
      dateType={dateType}
    />
  );
}

export const BoardAllArticleList = ({
  pageSize = 10,
  query,
  hidePortalNotice = false,
}: BoardArticleListProps) => {
  const searchParams = useSearchParams();
  const currentPage = Number(searchParams.get("page")) || 1;
  const router = useRouter();

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", page.toString());

    router.push(`?${params.toString()}`, { scroll: false });
  };

  const { data } = useArticles({
    pageSize,
    page: currentPage,
    query,
    hidePortalNotice,
  });

  return (
    <ArticleList
      posts={data?.results || []}
      showBoard
      showTimeAgo
      showAttachment
      showProfile
      showWriter
      titleFontSize="text-[16px]"
      showTopic
      showHit
      showStatus
      showAnswerStatus
      pagination
      currentPage={currentPage}
      totalPages={data?.num_pages || 1}
      onPageChange={handlePageChange}
    />
  );
};

// 🔸 Board 페이지 - 인기 게시글
export function BoardHotArticleList({
  pageSize = 10,
  query,
}: BoardArticleListProps) {
  const searchParams = useSearchParams();
  const currentPage = Number(searchParams.get("page")) || 1;
  const router = useRouter();

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", page.toString());

    router.push(`?${params.toString()}`, { scroll: false });
  };

  // queryKey가 'articles'로 시작해서 invalidateArticleQueries로 같이 갱신된다.
  const { data } = useQuery({
    queryKey: ["articles", "top", pageSize, currentPage, query],
    queryFn: () => fetchTopArticles({ pageSize, page: currentPage, query }),
    placeholderData: keepPreviousData,
    staleTime: 15_000,
  });
  const posts = data?.results || [];
  const totalPages = data?.num_pages || 1;
  return (
    <ArticleList
      posts={posts}
      showBoard={true}
      showTimeAgo={true}
      showAttachment={true}
      showProfile={true}
      showWriter={true}
      titleFontSize="text-[16px]"
      showTopic={true}
      showHit={true}
      showStatus={true}
      showAnswerStatus={true}
      showRank={true}
      pagination={true}
      currentPage={currentPage}
      totalPages={totalPages}
      onPageChange={handlePageChange}
    />
  );
}

//Board 페이지 - 최근 본 게시글
export function BoardRecentArticleList() {
  // 글을 열면 post/[id]에서 ['recentViewed']를 무효화한다.
  const { data: posts = [] } = useQuery({
    queryKey: ["recentViewed", 5, 1],
    queryFn: async () => (await fetchRecentViewedPosts({ pageSize: 5 })).results,
    staleTime: 30_000,
  });
  return (
    <ArticleList
      posts={posts}
      showAttachment={true}
      showTimeAgo={true}
      titleFontSize="text-[14px]"
    ></ArticleList>
  );
}

//Board 페이지 - 북마크한 게시글
export function BoardBookmarkedArticlesList() {
  // 담기/빼기 시 post/[id]에서 ['archives']를 무효화한다.
  const { data: posts = [] } = useQuery({
    queryKey: ["archives", "sidebar"],
    queryFn: async () => {
      const Response = await fetchArchives();
      //@ TODO : 알맞는 타입 추가하기
      return (Response.results || []).map((item: any) => item.parent_article);
    },
    staleTime: 30_000,
  });
  return (
    <ArticleList
      posts={posts}
      showAttachment={true}
      showTimeAgo={true}
      titleFontSize="text-[14px]"
    />
  );
}

interface Filters {
  seeSexual: boolean;
  seeSocial: boolean;
}

function isPostHidden(post: any, filters: Filters) {
  if (!filters.seeSexual && post.isSexual) return true;
  if (!filters.seeSocial && post.isSocial) return true;
  return false;
}

// 프로필 목록 공통: 성인/정치 필터 표시 + 제목/본문 검색 (서버가 아니라 화면에서 거른다)
function applyFilters(posts: any[], filters: Filters, search: string) {
  let filteredPosts = posts.map((post: any) => {
    if (isPostHidden(post, filters)) {
      const newPost = { ...post };
      newPost.why_hidden = newPost.why_hidden ? [...newPost.why_hidden] : [];
      if (post.isSexual && !filters.seeSexual)
        newPost.why_hidden.push("ADULT_CONTENT");
      if (post.isSocial && !filters.seeSocial)
        newPost.why_hidden.push("SOCIAL_CONTENT");
      return newPost;
    }
    return post;
  });

  if (search) {
    const lowerSearch = search.toLowerCase();
    filteredPosts = filteredPosts.filter(
      (post: any) =>
        post.title?.toLowerCase().includes(lowerSearch) ||
        post.content?.toLowerCase().includes(lowerSearch),
    );
  }
  return filteredPosts;
}

export function ProfileMyArticleList({
  filters,
  search,
}: {
  filters: Filters;
  search: string;
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const { data: user } = useMe();
  const userId = user?.user as number | undefined;

  // 서버에는 페이지만 보낸다. 검색/필터는 받아온 결과를 화면에서 거르므로 debounce가 필요 없다.
  const { data } = useQuery({
    queryKey: ["articles", "mine", userId, currentPage],
    queryFn: () => fetchArticles({ pageSize: 10, page: currentPage, userId: Number(userId) }),
    enabled: !!userId,
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
  const totalPages = data?.num_pages || 1;
  const posts = useMemo(
    () => applyFilters(data?.results || [], filters, search),
    [data, filters, search],
  );
  return (
    <ArticleList
      posts={posts}
      currentPage={currentPage}
      totalPages={totalPages}
      onPageChange={setCurrentPage}
      showWriter={true}
      showProfile={true}
      showHit={true}
      showStatus={true}
      showAttachment={true}
      showTimeAgo={true}
      pagination={true}
      titleFontSize="text-base"
      titleFontWeight="font-semibold"
      gapBetweenPosts={12}
      gapBetweenTitleAndMeta={4}
    />
  );
}

export function ProfileRecentArticleList({
  filters,
  search,
}: {
  filters: Filters;
  search: string;
}) {
  const [currentPage, setCurrentPage] = useState(1);

  // 서버에는 페이지만 보낸다. 검색/필터는 받아온 결과를 화면에서 거른다.
  const { data } = useQuery({
    queryKey: ["recentViewed", 10, currentPage],
    queryFn: () => fetchRecentViewedPosts({ pageSize: 10, page: currentPage }),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
  const totalPages = data?.num_pages || 1;
  const posts = useMemo(
    () => applyFilters(data?.results || [], filters, search),
    [data, filters, search],
  );
  return (
    <ArticleList
      posts={posts}
      showAttachment
      showTimeAgo
      showWriter
      showProfile
      showHit
      showStatus
      pagination
      currentPage={currentPage}
      totalPages={totalPages}
      onPageChange={setCurrentPage}
      titleFontSize="text-base"
      titleFontWeight="font-semibold"
      gapBetweenPosts={12}
      gapBetweenTitleAndMeta={4}
    />
  );
}

// Profile 페이지 - 북마크 한 글
export function ProfileBookmarkedArticlesList({
  filters,
  search,
}: {
  filters: Filters;
  search: string;
}) {
  const [currentPage, setCurrentPage] = useState(1);

  const { data } = useQuery({
    queryKey: ["archives", 10, currentPage],
    queryFn: () => fetchArchives({ pageSize: 10, page: currentPage }),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
  const totalPages = data?.num_pages || 1;
  const posts = useMemo(() => {
    const articles = (data?.results || [])
      .map((item: any) => item?.parent_article)
      .filter((article: any) => article && article.id && article.title);
    return applyFilters(articles, filters, search);
  }, [data, filters, search]);
  return (
    <ArticleList
      posts={posts}
      showAttachment
      showTimeAgo
      showWriter
      showProfile
      showHit
      showStatus
      pagination
      currentPage={currentPage}
      totalPages={totalPages}
      onPageChange={setCurrentPage}
      titleFontSize="text-base"
      titleFontWeight="font-semibold"
      gapBetweenPosts={12}
      gapBetweenTitleAndMeta={4}
    />
  );
}

// Post 페이지 - 하단 글 목록 (아직 구현 X)
export function PostBottomeArticleList() {
  return null;
}

// User Profile 페이지 - 다른 사용자가 작성한 글
export function UserProfileArticleList({ userId }: { userId: number }) {
  const [currentPage, setCurrentPage] = useState(1);

  const { data } = useQuery({
    queryKey: ["articles", "user", userId, currentPage],
    queryFn: () => fetchUserPosts(userId, currentPage),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
  const posts = data?.results || [];
  const totalPages = data?.num_pages || 1;
  return (
    <ArticleList
      posts={posts}
      showBoard={true}
      showTimeAgo={true}
      showAttachment={true}
      showProfile={true}
      showWriter={true}
      titleFontSize="text-[16px]"
      showTopic={true}
      showHit={true}
      showStatus={true}
      showAnswerStatus={true}
      pagination={true}
      currentPage={currentPage}
      totalPages={totalPages}
      onPageChange={setCurrentPage}
    />
  );
}


interface CourseArticleListProps {
  pageSize?: number;
  query?: string;
  courseId: number;
}

interface MajorArticleListProps {
  pageSize?: number;
  query?: string;
  stdDeptId: number | string;
}

// 과목/학과 게시판 목록. ?page= 와 표시 옵션은 같고 데이터 출처만 다르다.
function ScopedArticleList({
  queryKey,
  fetchPage,
  postHref,
}: {
  queryKey: unknown[];
  fetchPage: (page: number) => Promise<any>;
  postHref: (post: any) => string;
}) {
  const searchParams = useSearchParams();
  const currentPage = Number(searchParams.get('page')) || 1;
  const router = useRouter();

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', page.toString());

    router.push(`?${params.toString()}`, { scroll: false });
  }

  const { data } = useQuery({
    queryKey: [...queryKey, currentPage],
    queryFn: () => fetchPage(currentPage),
    placeholderData: keepPreviousData,
    staleTime: 60 * 60 * 1000,
  })

  return (
    <ArticleList
      posts={data?.results || []}
      showTimeAgo={true}
      showProfile={true}
      showWriter={true}
      showStatus={true}
      showHit={true}
      titleFontSize="text-[16px]"
      showTopic={true}
      pagination={true}
      currentPage={currentPage}
      totalPages={data?.num_pages || 1}
      onPageChange={handlePageChange}
      postHref={postHref}
    />
  )
}

export function CourseArticleList({ pageSize = 10, query, courseId }: CourseArticleListProps) {
  return (
    <ScopedArticleList
      queryKey={["courses", courseId, pageSize, query]}
      fetchPage={(page) => fetchCourseArticles({ courseId, query, pageSize, page })}
      postHref={(post) => `/post/${post.id}?course_id=${courseId}`}
    />
  )
}

export function MajorArticleList({ pageSize = 10, query, stdDeptId }: MajorArticleListProps) {
  return (
    <ScopedArticleList
      queryKey={["majorArticles", stdDeptId, pageSize, query]}
      fetchPage={(page) => fetchMajorArticles({ stdDeptId, query, pageSize, page })}
      postHref={(post) => `/post/${post.id}?std_dept_id=${stdDeptId}`}
    />
  )
}

export function MarketArticleContainer() {
  const [currentPage, setCurrentPage] = useState(1);

  const { data } = useArticles({ boardId: 4, pageSize: 12, page: currentPage });
  const posts = data?.results || [];
  const totalPages = data?.num_pages || 1;
  return (
    <GridArticleList
      posts={posts}
      currentPage={currentPage}
      totalPages={totalPages}
      onPageChange={setCurrentPage}
    />
  );
}