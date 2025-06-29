'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState, useMemo } from 'react'
import { BoardArticleList } from '@/containers/ArticleList'
import { fetchBoardList } from '@/lib/api/board'
import Image from 'next/image'

// API 타입 정의
interface Topic {
  id: number;
  slug: string;
  ko_name: string;
  en_name: string;
}
interface BoardConfig {
  id: number;
  slug: string;
  ko_name: string;
  en_name: string;
  ko_banner_description?: string;
  topics: Topic[];
  user_writable: boolean;
  description?: string;
}

export const POPULAR_BOARD = {
  name: '인기글',
  slug: 'popular',
  description: '인기있는 게시글 모음'
};

export default function Board() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [boardConfigs, setBoardConfigs] = useState<BoardConfig[]>([]);
  const [selectedBoard, setSelectedBoard] = useState<BoardConfig | null>(null);
  const [currentBoardType, setCurrentBoardType] = useState<'all' | 'popular' | 'board'>('all');
  const [currentBoardId, setCurrentBoardId] = useState<number | null>(null);

  // 말머리(Topic) 필터 상태
  const [selectedTopicId, setSelectedTopicId] = useState<string>('');
  // 검색어 상태
  const [search, setSearch] = useState<string>('');

  // 게시판 목록 불러오기 (API)
  useEffect(() => {
    fetchBoardList().then((data) => setBoardConfigs(data));
  }, []);

  // URL 파라미터에 따라 게시판 선택
  useEffect(() => {
    if (boardConfigs.length === 0) return;
    const boardParam = searchParams.get('board');
    if (!boardParam) {
      setCurrentBoardType('all');
      setSelectedBoard(null);
      setCurrentBoardId(null);
    } else if (boardParam === 'popular') {
      setCurrentBoardType('popular');
      setSelectedBoard(null);
      setCurrentBoardId(null);
    } else {
      const config = boardConfigs.find(config => config.slug === boardParam);
      if (config) {
        setCurrentBoardType('board');
        setSelectedBoard(config);
        setCurrentBoardId(config.id);
      } else {
        router.push('/board');
      }
    }
  }, [searchParams, router, boardConfigs]);

  // 현재 보드의 topic 목록 추출
  const topicList = useMemo(() => {
    if (!selectedBoard || !selectedBoard.topics) return [];
    return selectedBoard.topics;
  }, [selectedBoard]);

  const handleBoardSelect = (config: BoardConfig) => {
    router.push(`/board?board=${config.slug}`);
  };

  const handlePopularBoard = () => {
    router.push('/board?board=popular');
  };

  const handleAllBoard = () => {
    router.push('/board');
  };

  const getCurrentTitle = () => {
    if (currentBoardType === 'popular') return POPULAR_BOARD.name;
    if (selectedBoard) return selectedBoard.ko_name;
    return '전체보기';
  };

  const getCurrentDescription = () => {
    if (currentBoardType === 'popular') return POPULAR_BOARD.description;
    if (selectedBoard) return selectedBoard.ko_banner_description || selectedBoard.description;
    return '모든 게시판의 글을 한번에 볼 수 있습니다';
  };

  // 1. state 관리: page가 reload될 때 무조건 말머리 없음을 기본값으로
  useEffect(() => {
    setSelectedTopicId(''); // board가 바뀔 때마다 말머리 필터 초기화
  }, [currentBoardId]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            {getCurrentTitle()}
          </h1>
          <p className="text-gray-600">
            {getCurrentDescription()}
          </p>
        </div>

        {/* 메인 레이아웃 - 좌우 분할 */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* 좌측: 보드 네비게이션 */}
          <div className="lg:w-1/3 xl:w-1/4">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-8">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">게시판 목록</h2>
              <div className="space-y-3">
                {/* 전체보기 */}
                <button
                  onClick={handleAllBoard}
                  className={`w-full p-3 rounded-lg border text-left transition-colors ${
                    currentBoardType === 'all'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="font-medium text-sm">전체보기</div>
                  <div className="text-xs text-gray-500">모든 게시판</div>
                </button>
                {/* 인기글 */}
                <button
                  onClick={handlePopularBoard}
                  className={`w-full p-3 rounded-lg border text-left transition-colors ${
                    currentBoardType === 'popular'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="font-medium text-sm">{POPULAR_BOARD.name}</div>
                  <div className="text-xs text-gray-500">인기 게시글</div>
                </button>
                {/* 각 보드별 버튼 */}
                {boardConfigs.map((config) => (
                  <button
                    key={config.id}
                    onClick={() => handleBoardSelect(config)}
                    className={`w-full p-3 rounded-lg border text-left transition-colors ${
                      selectedBoard?.id === config.id
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="font-medium text-sm">{config.ko_name}</div>
                    <div className="text-xs text-gray-500 truncate">{config.ko_banner_description || config.description}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 우측: 게시글 목록 */}
          <div className="lg:w-2/3 xl:w-3/4">
            <div className="bg-white rounded-lg shadow-sm p-6">
              {/* 보드 정보 헤더 */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 pb-4 border-b border-gray-100">
                <div className="mb-2 sm:mb-0">
                  <h3 className="text-lg font-semibold text-gray-800">
                    {getCurrentTitle()}
                  </h3>
                </div>
              </div>
              {/* 게시글 목록 영역 */}
              <div className="space-y-4">
                {/* 옵션 바: 말머리, 검색, 글쓰기 */}
                <div className="flex items-center justify-between mt-2 sm:mt-0 flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* 말머리 드롭다운 */}
                    {topicList.length > 0 && (
                      <div className="relative flex-shrink-0">
                        <select
                          className={
                            `rounded-xl pl-7 pr-3 py-1.5 text-sm appearance-none transition-colors w-auto
                            ${selectedTopicId === ''
                              ? 'bg-gray-100 text-gray-500'
                              : 'bg-[#fdf0f0] text-ara_red'}
                            `
                          }
                          value={selectedTopicId}
                          onChange={e => setSelectedTopicId(e.target.value)}
                          style={{
                            color: selectedTopicId ? 'transparent' : undefined,
                            textShadow: selectedTopicId ? 'none' : undefined,
                          }}
                        >
                          <option value="" className="bg-white text-gray-700">
                            말머리 전체
                          </option>
                          {topicList.map(topic => (
                            <option
                              key={topic.id}
                              value={String(topic.id)}
                              className="bg-white text-black"
                            >
                              {topic.ko_name}
                            </option>
                          ))}
                        </select>
                        {/* 선택된 값에만 # 붙이기 위한 커스텀 라벨 */}
                        {selectedTopicId && (
                          <span
                            className="pointer-events-none absolute left-7 top-1/2 -translate-y-1/2 text-ara_red text-sm font-normal select-none"
                            style={{
                              zIndex: 2,
                              background: 'inherit',
                              padding: '0 0.25rem',
                              lineHeight: '1.5rem',
                            }}
                          >
                            #{topicList.find(t => String(t.id) === selectedTopicId)?.ko_name}
                          </span>
                        )}
                        {/* filter 아이콘 - 2. 아이콘과 텍스트 사이 gap 줄이기 (pl-9 → pl-7, left-9 → left-7) */}
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none">
                          <Image
                            src="/filter-ara-red.svg"
                            alt="말머리 필터"
                            width={15}
                            height={15}
                            style={{
                              filter: selectedTopicId === ''
                                // 진한 회색(예: #6b7280, tailwind text-gray-600)로 보이도록
                                ? 'invert(36%) sepia(6%) saturate(0%) hue-rotate(176deg) brightness(93%) contrast(87%)'
                                // 기본 ara_red (#ed3a3a)로 보이도록
                                : 'invert(41%) sepia(97%) saturate(749%) hue-rotate(334deg) brightness(97%) contrast(101%)'
                            }}
                          />
                        </span>
                      </div>
                    )}
                    {/* miniSearch Bar */}
                    <div className="relative">
                      <input
                        type="text"
                        className="rounded-xl pl-8 pr-2 py-1.5 text-sm w-45 bg-gray-50 text-gray-700 font-medium"
                        placeholder="검색어를 입력하세요"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                      />
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-base pointer-events-none">
                        <svg width="16" height="16" fill="none" viewBox="0 0 16 16"><path d="M11.5 11.5L15 15M7 12A5 5 0 1 1 7 2a5 5 0 0 1 0 10Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                      </span>
                    </div>
                  </div>
                  {/* 글쓰기 버튼: 오른쪽 끝 */}
                  <button
                    className="border border-ara_red text-ara_red rounded-lg px-3 py-1 text-sm font-normal hover:bg-ara_red hover:text-white transition ml-2 mt-2 sm:mt-0"
                    onClick={() => router.push(`/write?board=${selectedBoard?.id ?? ''}`)}
                    disabled={!selectedBoard?.user_writable}
                  >
                    게시물 작성하기
                  </button>
                </div>
                {/* 전체보기 */}
                {currentBoardType === 'all' && (
                  <div className="bg-gray-50 rounded-lg p-8 text-center text-gray-500">
                    <p>전체 게시글 목록 (추후 구현)</p>
                    <p className="text-sm mt-2">모든 게시판의 글을 표시합니다</p>
                  </div>
                )}
                {/* 인기글 */}
                {currentBoardType === 'popular' && (
                  <div className="bg-gray-50 rounded-lg p-8 text-center text-gray-500">
                    <p>인기글 목록 (추후 구현)</p>
                    <p className="text-sm mt-2">인기있는 게시글을 표시합니다</p>
                  </div>
                )}
                {/* 특정 보드 게시글 */}
                {currentBoardType === 'board' && currentBoardId !== null && (
                  <div className="max-w-none">
                    <BoardArticleList
                      boardId={currentBoardId}
                      pageSize={10}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
