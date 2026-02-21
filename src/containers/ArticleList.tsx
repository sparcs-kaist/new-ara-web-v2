/* eslint-disable */

import React, { useEffect, useState, useRef } from 'react';
import ArticleList from '@/components/ArticleList/ArticleList';
import { fetchTopArticles, fetchArticles, fetchAllArticlesExcludingPortalNotice } from "@/lib/api/board";
import { fetchRecentViewedPosts, fetchArchives } from '@/lib/api/board';
import { fetchMe } from "@/lib/api/user";
import { fetchUserPosts } from '@/lib/api/user_profile';
import { debounce } from "lodash";

//메인 페이지 - 지금 핫한 글
export function HotPreview() {
  const [posts, setPosts] = useState([]);
  useEffect(() => {
    const fetchData = async () => {
      const Response = await fetchTopArticles({ pageSize: 3 });
      setPosts(Response.results);
    }
    fetchData();
  }, []); // 빈 배열 추가 - 컴포넌트 마운트 시 한 번만 실행
  return (
    <ArticleList
      posts={posts}
      showRank={true}
      showWriter={true}
      showTimeAgo={true}
      showStatus={true}
      showAttachment={true}
      titleFontSize='text-[16px]'
    >
    </ArticleList>
  )
}

//메인 페이지 - 방금 올라온 글
export function RecentPreview() {
  const [posts, setPosts] = useState([]);
  useEffect(() => {
    const fetchData = async () => {
      const Response = await fetchArticles({ pageSize: 3, ordering: '-created_at' });
      setPosts(Response.results);
    }
    fetchData();
  }, []); // 빈 배열 추가 - 컴포넌트 마운트 시 한 번만 실행
  return (
    <ArticleList
      posts={posts}
      showBoard={true}
      showTimeAgo={true}
      showAttachment={true}
      showProfile={true}
      showWriter={true}
      titleFontSize='text-[16px]'
    >
    </ArticleList>
  )
}

//메인 페이지 - 학교에게 전합니다.
export function ToSchoolPreview() {
  const [posts, setPosts] = useState([]);
  useEffect(() => {
    const fetchData = async () => {
      const Response = await fetchArticles({ pageSize: 3, boardId: 14 });
      setPosts(Response.results);
    }
    fetchData();
  }, []); // 빈 배열 추가 - 컴포넌트 마운트 시 한 번만 실행
  return (
    <ArticleList
      posts={posts}
      showTimeAgo={true}
      showAnswerStatus={true}
      showStatus={true}
      titleFontSize='text-[16px]'

    >
    </ArticleList>
  )
}

//메인 페이지 - 포탈 공지
export function PortalNoticePreview() {
  return;
}

interface BoardArticleListProps {
  boardId?: number;
  pageSize?: number;
  topicId?: number;
  query?: string; // 검색어 prop 추가
}

// 🔸 Board 페이지 - 일반 게시글
export function BoardArticleList({ boardId = 7, pageSize = 10, topicId, query }: BoardArticleListProps) {
  const [posts, setPosts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const requestTokenRef = useRef(0);

  useEffect(() => {
    const currentToken = ++requestTokenRef.current;

    const fetchData = async () => {
      const Response = await fetchArticles({
        pageSize,
        boardId,
        page: currentPage,
        topicId,
        query,
      });

      if (requestTokenRef.current === currentToken) {
        setPosts(Response.results);
        setTotalPages(Response.num_pages || 1);
      }
    };
    fetchData();
  }, [boardId, pageSize, currentPage, topicId, query]);

  return (
    <ArticleList
      posts={posts}
      showTimeAgo={true}
      showProfile={true}
      showWriter={true}
      showStatus={true}
      showAnswerStatus={true}
      showHit={true}
      titleFontSize='text-[16px]'
      showTopic={true}
      pagination={true}
      currentPage={currentPage}
      totalPages={totalPages}
      onPageChange={setCurrentPage}
    />
  );
}

// 검색을 지원하는 Board 페이지의 컴포넌트들의 경우
// state update를 fetch한 순서대로 유지하기 위해 useRef를 사용합니다. (ABBA 문제 방지)
// 가장 최근에 요청한 fetch의 state만을 반영할 수 있도록 합니다.
// 다른 방법으로는 Abort Controller를 사용하여 이전 요청을 취소하는 방법이 있지만,
// 이 경우에는 useRef를 사용하여 요청 토큰을 관리하는 것이 더 간단하고 효과적이다.

// Board 페이지 - 전체 게시글
export function BoardAllArticleList({ pageSize = 10, query }: BoardArticleListProps) {
  const [posts, setPosts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const requestTokenRef = useRef(0);

  useEffect(() => {
    const currentToken = ++requestTokenRef.current;

    const fetchData = async () => {
      const Response = await fetchArticles({ pageSize, page: currentPage, query });

      if (requestTokenRef.current === currentToken) {
        setPosts(Response.results);
        setTotalPages(Response.num_pages || 1);
      }
    };
    fetchData();
  }, [pageSize, currentPage, query]);

  return (
    <ArticleList
      posts={posts}
      showBoard={true}
      showTimeAgo={true}
      showAttachment={true}
      showProfile={true}
      showWriter={true}
      titleFontSize='text-[16px]'
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

export function BoardAllArticleExcludePortalNoticeList({ pageSize = 10, query }: BoardArticleListProps) {
  const [posts, setPosts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const requestTokenRef = useRef(0);

  useEffect(() => {
    const currentToken = ++requestTokenRef.current;

    const fetchData = async () => {
      const Response = await fetchAllArticlesExcludingPortalNotice({ pageSize, page: currentPage, query });

      if (requestTokenRef.current === currentToken) {
        setPosts(Response.results);
        setTotalPages(Response.num_pages || 1);
      }
    };
    fetchData();
  }, [pageSize, currentPage, query]);

  return (
    <ArticleList
      posts={posts}
      showBoard={true}
      showTimeAgo={true}
      showAttachment={true}
      showProfile={true}
      showWriter={true}
      titleFontSize='text-[16px]'
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

// 🔸 Board 페이지 - 인기 게시글
export function BoardHotArticleList({ pageSize = 10, query }: BoardArticleListProps) {
  const [posts, setPosts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const requestTokenRef = useRef(0);

  useEffect(() => {
    const currentToken = ++requestTokenRef.current;

    const fetchData = async () => {
      const Response = await fetchTopArticles({ pageSize, page: currentPage, query });

      if (requestTokenRef.current === currentToken) {
        setPosts(Response.results);
        setTotalPages(Response.num_pages || 1);
      }
    };
    fetchData();
  }, [pageSize, currentPage, query]);

  return (
    <ArticleList
      posts={posts}
      showBoard={true}
      showTimeAgo={true}
      showAttachment={true}
      showProfile={true}
      showWriter={true}
      titleFontSize='text-[16px]'
      showTopic={true}
      showHit={true}
      showStatus={true}
      showAnswerStatus={true}
      showRank={true}
      pagination={true}
      currentPage={currentPage}
      totalPages={totalPages}
      onPageChange={setCurrentPage}
    />
  );
}

//Board 페이지 - 최근 본 게시글
export function BoardRecentArticleList() {
  const [posts, setPosts] = useState([]);
  useEffect(() => {
    const fetchData = async () => {
      const Response = await fetchRecentViewedPosts({ pageSize: 5 });
      setPosts(Response.results);
    }
    fetchData();
  }, []);
  return (
    <ArticleList
      posts={posts}
      showAttachment={true}
      showTimeAgo={true}
      titleFontSize='text-[14px]'
    >
    </ArticleList>
  )
}

//Board 페이지 - 북마크한 게시글
export function BoardBookmarkedArticlesList() {
  const [posts, setPosts] = useState([]);
  useEffect(() => {
    const fetchData = async () => {
      const Response = await fetchArchives();
      //@ TODO : 알맞는 타입 추가하기
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const articles = (Response.results || []).map((item: any) => item.parent_article);
      setPosts(articles);
    }
    fetchData();
  }, []);
  return (
    <ArticleList
      posts={posts}
      showAttachment={true}
      showTimeAgo={true}
      titleFontSize='text-[14px]'
    />
  )
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

export function ProfileMyArticleList({ filters, search }: { filters: Filters, search: string }) {
  const [posts, setPosts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [userId, setUserId] = useState<number | null>(null);

  // 유저 정보 가져오기
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await fetchMe();
        setUserId(user.user);
      } catch (error) {
        console.error("유저 정보를 불러오는 데 실패했습니다.", error);
      }
    };
    fetchUser();
  }, []);

  // 내가 쓴 글 가져오기 (debounce 적용)
  useEffect(() => {
    if (!userId) return;

    const fetchData = async (searchTerm: string) => {
      try {
        const response = await fetchArticles({
          pageSize: 10,
          page: currentPage,
          userId: Number(userId),
        });

        let filteredPosts = response.results.map((post: any) => {
          if (isPostHidden(post, filters)) {
            const newPost = { ...post };
            newPost.why_hidden = newPost.why_hidden ? [...newPost.why_hidden] : [];
            if (post.isSexual && !filters.seeSexual) newPost.why_hidden.push('ADULT_CONTENT');
            if (post.isSocial && !filters.seeSocial) newPost.why_hidden.push('SOCIAL_CONTENT');
            return newPost;
          }
          return post;
        });

        if (searchTerm) {
          const lowerSearch = searchTerm.toLowerCase();
          filteredPosts = filteredPosts.filter((post: any) =>
            post.title?.toLowerCase().includes(lowerSearch) ||
            post.content?.toLowerCase().includes(lowerSearch)
          );
        }

        setPosts(filteredPosts);
        setTotalPages(response.num_pages || 1);
      } catch (error) {
        console.error("게시글을 불러오는 데 실패했습니다.", error);
      }
    };

    const debouncedFetch = debounce(fetchData, 300);
    debouncedFetch(search);

    return () => {
      debouncedFetch.cancel(); // cleanup
    };
  }, [userId, currentPage, filters, search]);

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

export function ProfileRecentArticleList({ filters, search }: { filters: Filters, search: string }) {
  const [posts, setPosts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    let debounceTimer: NodeJS.Timeout;

    const fetchData = async (searchTerm: string) => {
      try {
        const response = await fetchRecentViewedPosts({ pageSize: 10, page: currentPage });

        let filteredPosts = response.results.map((post: any) => {
          if (isPostHidden(post, filters)) {
            const newPost = { ...post };
            newPost.why_hidden = newPost.why_hidden ? [...newPost.why_hidden] : [];
            if (post.isSexual && !filters.seeSexual) newPost.why_hidden.push('ADULT_CONTENT');
            if (post.isSocial && !filters.seeSocial) newPost.why_hidden.push('SOCIAL_CONTENT');
            return newPost;
          }
          return post;
        });

        if (searchTerm) {
          const lowerSearch = searchTerm.toLowerCase();
          filteredPosts = filteredPosts.filter((post: any) =>
            post.title?.toLowerCase().includes(lowerSearch) ||
            post.content?.toLowerCase().includes(lowerSearch)
          );
        }

        setPosts(filteredPosts);
        setTotalPages(response.num_pages || 1);
      } catch (error) {
        console.error("최근 본 게시글을 불러오는 데 실패했습니다.", error);
      }
    };

    // 300ms debounce
    debounceTimer = setTimeout(() => {
      fetchData(search);
    }, 300);

    return () => clearTimeout(debounceTimer); // cleanup
  }, [currentPage, filters, search]);

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
export function ProfileBookmarkedArticlesList({ filters, search }: { filters: Filters, search: string }) {
  const [posts, setPosts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    let debounceTimer: NodeJS.Timeout;

    const fetchData = async (searchTerm: string) => {
      try {
        const response = await fetchArchives({ pageSize: 10, page: currentPage });

        const articles = (response.results || [])
          .map((item: any) => item?.parent_article)
          .filter((article: any) => article && article.id && article.title);

        let filteredPosts = articles.map((post: any) => {
          if (isPostHidden(post, filters)) {
            const newPost = { ...post };
            newPost.why_hidden = newPost.why_hidden ? [...newPost.why_hidden] : [];
            if (post.isSexual && !filters.seeSexual) newPost.why_hidden.push('ADULT_CONTENT');
            if (post.isSocial && !filters.seeSocial) newPost.why_hidden.push('SOCIAL_CONTENT');
            return newPost;
          }
          return post;
        });

        if (searchTerm) {
          const lowerSearch = searchTerm.toLowerCase();
          filteredPosts = filteredPosts.filter((post: any) =>
            post.title?.toLowerCase().includes(lowerSearch) ||
            post.content?.toLowerCase().includes(lowerSearch)
          );
        }

        setPosts(filteredPosts);
        setTotalPages(response.num_pages || 1);
      } catch (error) {
        console.error("북마크 게시글을 불러오는 데 실패했습니다.", error);
      }
    };

    debounceTimer = setTimeout(() => fetchData(search), 300); // 300ms debounce

    return () => clearTimeout(debounceTimer); // cleanup
  }, [currentPage, filters, search]);

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
  const [posts, setPosts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const requestTokenRef = useRef(0);

  useEffect(() => {
    const currentToken = ++requestTokenRef.current;

    const fetchData = async () => {
      const Response = await fetchUserPosts(userId, currentPage);

      if (requestTokenRef.current === currentToken) {
        setPosts(Response.results);
        setTotalPages(Response.num_pages || 1);
      }
    };
    fetchData();
  }, [userId, currentPage]);

  return (
    <ArticleList
      posts={posts}
      showBoard={true}
      showTimeAgo={true}
      showAttachment={true}
      showProfile={true}
      showWriter={true}
      titleFontSize='text-[16px]'
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