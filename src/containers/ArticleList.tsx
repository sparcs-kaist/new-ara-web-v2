//Dumb Component (ArticleList)를 사용하는 모든 component들의 Set입니다.

import React, { useEffect, useState, useRef } from 'react';
import ArticleList from '@/components/ArticleList/ArticleList';
import { fetchTopArticles, fetchArticles } from "@/lib/api/board";
import { fetchRecentViewedPosts, fetchArchives } from '@/lib/api/board';
import { fetchMe } from "@/lib/api/user";


//메인 페이지 - 지금 핫한 글
export function HotPreview() {
    const [posts, setPosts] = useState([]);
    useEffect(() => {
        const fetchData = async () => {
            const Response = await fetchTopArticles({pageSize: 3});
            setPosts(Response.results);
        }
        fetchData();
    }, []); // 빈 배열 추가 - 컴포넌트 마운트 시 한 번만 실행
    return(
        <ArticleList
            posts = {posts}
            showRank = {true}
            showWriter = {true}
            showTimeAgo = {true}
            showStatus = {true}
            showAttachment = {true}
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
            const Response = await fetchArticles({pageSize: 3, ordering: '-created_at'});
            setPosts(Response.results);
        }
        fetchData();
    }, []); // 빈 배열 추가 - 컴포넌트 마운트 시 한 번만 실행
    return(
        <ArticleList
            posts = {posts}
            showBoard = {true}
            showTimeAgo = {true}
            showAttachment = {true}
            showProfile = {true}
            showWriter = {true}
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
            const Response = await fetchArticles({pageSize: 3, boardId: 14});
            setPosts(Response.results);
        }
        fetchData();
    }, []); // 빈 배열 추가 - 컴포넌트 마운트 시 한 번만 실행
    return(
        <ArticleList
            posts = {posts}
            showTimeAgo = {true}
            showAnswerStatus = {true}
            showStatus = {true}
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
        const fetchData = async() => {
            const Response = await fetchRecentViewedPosts({pageSize: 5});
            setPosts(Response.results);
        }
        fetchData();
    }, []);
    return(
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
        const fetchData = async() => {
            const Response = await fetchArchives();
            //@ TODO : 알맞는 타입 추가하기
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const articles = (Response.results || []).map((item: any) => item.parent_article);
            setPosts(articles);
        }
        fetchData();
    }, []);
    return(
        <ArticleList
            posts={posts}  
            showAttachment={true}
            showTimeAgo={true}
            titleFontSize='text-[14px]'       
        />
    )
}

//Profile 페이지 - 내가 쓴 글
export function ProfileMyArticleList () {
  const [posts, setPosts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [userId, setUserId] = useState<number | null>(null); // userId → username

  // 유저 정보 가져오기
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await fetchMe();
        console.log("User info:", user);
        setUserId(user.user);
      } catch (error) {
        console.error("유저 정보를 불러오는 데 실패했습니다.", error);
      }
    };
    fetchUser();
  }, []);
  
  // 내가 쓴 글 가져오기
  useEffect(() => {
    if (!userId) return;

    const fetchData = async () => {
      try {
        const response = await fetchArticles({
          pageSize: 10,
          page: currentPage,
          userId: Number(userId),
        });

        console.log("Fetched articles:", response);
        setPosts(response.results);
        setTotalPages(response.num_pages || 1);
      } catch (error) {
        if (error instanceof Error) {
          console.error("게시글을 불러오는 데 실패했습니다.", error.message);
        } else {
          console.error("게시글을 불러오는 데 실패했습니다.", error);
        }
      }
    };
    fetchData();
  }, [userId, currentPage]);
  

  useEffect(() => {
    const debugArticles = async () => {
      const user = await fetchMe();
      const res = await fetchArticles({ pageSize: 1, page: 1 });
  
      console.log("🔍 현재 로그인한 유저 username:", user.user);
      console.log("📰 샘플 게시글의 created_by.username:", res.results[0]?.created_by?.username);
    };
    debugArticles();
  }, []);

  
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


//Profile 페이지 - 최근 본 글
export function ProfileRecentArticleList() {
  const [posts, setPosts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const fetchData = async () => {
      const Response = await fetchRecentViewedPosts({ pageSize: 10, page: currentPage });
      setPosts(Response.results);
      setTotalPages(Response.num_pages || 1);
    };
    fetchData();
  }, [currentPage]);

  return (
    <ArticleList
      posts={posts}
      showAttachment={true}
      showTimeAgo={true}
      showWriter={true}
      showProfile={true}
      showHit={true}
      showStatus={true}
      pagination={true}
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

//Profile 페이지 - 북마크 한 글
export function ProfileBookmarkedArticlesList() {
  const [posts, setPosts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const fetchData = async () => {
      const Response = await fetchArchives({ pageSize: 10, page: currentPage });
      // Response 결과에서 parent_article만 추출 (BoardBookmarkedArticlesList 참고)
      const articles = (Response.results || [])
        .map((item: any) => item?.parent_article)
        .filter((article: any) => article && article.id && article.title); // 필수 필드 기준 필터링

      setPosts(articles);
      setTotalPages(Response.num_pages || 1);
    };
    fetchData();
  }, [currentPage]);

  return (
    <ArticleList
      posts={posts}
      showAttachment={true}
      showTimeAgo={true}
      showWriter={true}
      showProfile={true}
      showHit={true}
      showStatus={true}
      pagination={true}
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

//Post 페이지 - 하단 글 목록
export function PostBottomeArticleList () {
    return;
}