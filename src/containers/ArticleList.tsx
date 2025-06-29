//Dumb Component (ArticleList)를 사용하는 모든 component들의 Set입니다.

import React, { useEffect, useState } from 'react';
import ArticleList from '@/components/ArticleList/ArticleList';
import { fetchTopArticles, fetchArticles } from "@/lib/api/board";
import { fetchRecentViewedPosts, fetchArchives } from '@/lib/api/board';

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

// Board 페이지 - 일반 게시글
export function BoardArticleList({ boardId = 7, pageSize = 10, topicId, query }: BoardArticleListProps) {
  const [posts, setPosts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const fetchData = async () => {
      const Response = await fetchArticles({
        pageSize,
        boardId,
        page: currentPage,
        topicId,
        query, // 검색어 적용
      });
      setPosts(Response.results);
      setTotalPages(Response.num_pages || 1);
    };
    fetchData();
  }, [boardId, pageSize, currentPage, topicId, query]); // query 의존성 추가

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

//Board 페이지 - 전체 게시글
export function BoardAllArticleList({ pageSize = 10, query }: BoardArticleListProps) {
    const [posts, setPosts] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        const fetchData = async () => {
            const Response = await fetchArticles({ pageSize, page: currentPage, query });
            setPosts(Response.results);
            setTotalPages(Response.num_pages || 1);
        }
        fetchData();
    }, [pageSize, currentPage, query]);

    return(
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
    )
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

//Board 페이지 - 인기 게시글
export function BoardHotArticleList({ pageSize = 10 }: BoardArticleListProps) {
    const [posts, setPosts] = useState([]);
    useEffect(() => {
        const fetchData = async () => {
            const Response = await fetchTopArticles({pageSize: pageSize});
            setPosts(Response.results);
        }
        fetchData();
    }, []);
    return(
        <ArticleList
            posts = {posts}
            showBoard = {true}
            showTimeAgo = {true}
            showAttachment = {true}
            showProfile = {true}
            showWriter = {true}
            titleFontSize='text-[16px]'
            showTopic = {true}
            showHit = {true}
            showStatus = {true}
            showAnswerStatus = {true}
            showRank = {true}
        >
        </ArticleList>
    )
}

//Profile 페이지 - 내가 쓴 글
export function ProfileMyArticleList () {
    return;
}

//Profile 페이지 - 최근 본 글
export function ProfileRecentArticleList () {
    return;
}

//Profile 페이지 - 북마크 한 글
export function ProfileBookmarkedArticlesList () {
    return;
}

//Post 페이지 - 하단 글 목록
export function PostBottomeArticleList () {
    return;
}