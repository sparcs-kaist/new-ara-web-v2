'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import { BoardArticleList, BoardAllArticleList, BoardHotArticleList, MarketArticleContainer } from '@/containers/ArticleList';
import { fetchBoardList } from '@/lib/api/board';
import Image from 'next/image';
import Sidebar from '@/components/Sidebar/Sidebar';
import Search from '@/components/Search';
import WriteButton from '@/components/Board/WriteButton';

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

const POPULAR_BOARD = {
    name: '인기글',
    slug: 'popular',
    description: '인기있는 게시글 모음',
};

export default function Board() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [boardConfigs, setBoardConfigs] = useState<BoardConfig[]>([]);
    const [selectedBoard, setSelectedBoard] = useState<BoardConfig | null>(null);
    const [currentBoardType, setCurrentBoardType] = useState<'all' | 'popular' | 'board'>('all');
    const [currentBoardId, setCurrentBoardId] = useState<number | null>(null);

    const [selectedTopicId, setSelectedTopicId] = useState<string>('');
    const [search, setSearch] = useState<string>('');
    const [searchInput, setSearchInput] = useState<string>('');
    const [excludePortalNotice, setExcludePortalNotice] = useState(false);
    const [isGrid, setIsGrid] = useState(true);
    // 검색 실행 핸들러: 상태 먼저 세팅 → URL 반영
    const handleSearch = () => {
        const trimmed = searchInput.trim();

        const params = new URLSearchParams(Array.from(searchParams.entries()));
        params.delete('page');
        if (trimmed) {
            params.set('search', trimmed);
        } else {
            params.delete('search');
        }
        router.replace(`?${params.toString()}`);
    };

    // 페이지 최초 진입 또는 URL 직접 입력 시만 search 상태 동기화
    useEffect(() => {
        const urlSearch = searchParams.get('search') || '';
        setSearch(urlSearch);
        setSearchInput(urlSearch);
    }, [searchParams]); // searchParams.toString()

    useEffect(() => {
        fetchBoardList().then((data) => setBoardConfigs(data));
    }, []);

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
            const config = boardConfigs.find((config) => config.slug === boardParam);
            if (config) {
                setCurrentBoardType('board');
                setSelectedBoard(config);
                setCurrentBoardId(config.id);
            } else {
                router.push('/board');
            }
        }
    }, [searchParams, router, boardConfigs]);

    const topicList = useMemo(() => {
        if (!selectedBoard || !selectedBoard.topics) return [];
        return selectedBoard.topics;
    }, [selectedBoard]);

    const getCurrentTitle = () => {
        if (currentBoardType === 'popular') return POPULAR_BOARD.name;
        if (selectedBoard) return selectedBoard.ko_name;
        return '전체보기';
    };

    useEffect(() => {
        setSelectedTopicId('');
    }, [currentBoardId]);

    return (
        <div className="min-h-screen">
            <div className="container mx-auto md:px-20 sm:px-12 xs:px-8 px-4 py-0">
                <div className="flex flex-col lg:flex-row gap-4">
                    <div className="lg:w-2/3 xl:w-3/4">
                        <div className="bg-white rounded-lg shadow-sm md:p-6 sm:p-3">
                            <div className="mb-3">
                                <h3 className="text-xl font-semibold text-black">{getCurrentTitle()}</h3>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between mt-2 sm:mt-0 flex-wrap">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        {topicList.length > 0 && (
                                            <div className="relative flex-shrink-0">
                                                <select
                                                    className={`rounded-xl pl-7 pr-3 py-1.5 text-sm appearance-none transition-colors w-auto ${selectedTopicId === '' ? 'bg-gray-100 text-gray-500' : 'bg-[#fdf0f0] text-ara_red'
                                                        }`}
                                                    value={selectedTopicId}
                                                    onChange={(e) => setSelectedTopicId(e.target.value)}
                                                    style={{
                                                        color: selectedTopicId ? 'transparent' : undefined,
                                                        textShadow: selectedTopicId ? 'none' : undefined,
                                                    }}
                                                >
                                                    <option value="" className="bg-white text-gray-700">
                                                        말머리 전체
                                                    </option>
                                                    {topicList.map((topic) => (
                                                        <option key={topic.id} value={String(topic.id)} className="bg-white text-black">
                                                            {topic.ko_name}
                                                        </option>
                                                    ))}
                                                </select>
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
                                                        #{topicList.find((t) => String(t.id) === selectedTopicId)?.ko_name}
                                                    </span>
                                                )}
                                                <span className="absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none">
                                                    <Image
                                                        src="/filter-ara-red.svg"
                                                        alt="말머리 필터"
                                                        width={15}
                                                        height={15}
                                                        style={{
                                                            filter:
                                                                selectedTopicId === ''
                                                                    ? 'invert(36%) sepia(6%) saturate(0%) hue-rotate(176deg) brightness(93%) contrast(87%)'
                                                                    : 'invert(41%) sepia(97%) saturate(749%) hue-rotate(334deg) brightness(97%) contrast(101%)',
                                                        }}
                                                    />
                                                </span>
                                            </div>
                                        )}

                                        <div className="relative">
                                            <Search
                                                searchInput={searchInput}
                                                setSearchInput={setSearchInput}
                                                handleSearch={handleSearch}
                                            />
                                        </div>
                                    </div>

                                    {currentBoardId === 4 && (
                                        <label className="flex items-center gap-1.5 mr-2 text-md text-gray-600 cursor-pointer select-none ml-auto mt-2 sm:mt-0">
                                            <input
                                                type="checkbox"
                                                checked={isGrid}
                                                onChange={(e) => setIsGrid(e.target.checked)}
                                                className="accent-[#e15858] w-3.5 h-3.5 cursor-pointer"
                                            />
                                            타일로 보기
                                        </label>
                                    )}

                                    {selectedBoard?.user_writable && <WriteButton href={currentBoardId ? `/write?board=${currentBoardId}` : "/write"} />}

                                    {currentBoardType === 'all' && (
                                        <label className="flex items-center gap-1.5 text-md text-gray-600 cursor-pointer select-none ml-auto mt-2 sm:mt-0">
                                            <input
                                                type="checkbox"
                                                checked={excludePortalNotice}
                                                onChange={(e) => setExcludePortalNotice(e.target.checked)}
                                                className="accent-[#e15858] w-3.5 h-3.5 cursor-pointer"
                                            />
                                            포탈 공지 제외
                                        </label>
                                    )}
                                </div>

                                {currentBoardType === 'all' && (
                                    <div className="max-w-none">
                                        <BoardAllArticleList query={search} hidePortalNotice={excludePortalNotice} />
                                    </div>
                                )}
                                {currentBoardType === 'popular' && (
                                    <div className="max-w-none">
                                        <BoardHotArticleList query={search} />
                                    </div>
                                )}
                                {currentBoardType === 'board' && currentBoardId !== null && (
                                    (currentBoardId === 4 && isGrid) ?
                                        <div className="max-w-none">
                                            <MarketArticleContainer />
                                        </div> :
                                        <div className="max-w-none">
                                            <BoardArticleList boardId={currentBoardId} pageSize={10} topicId={selectedTopicId ? Number(selectedTopicId) : undefined} query={search} />
                                        </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <Sidebar />
                </div>
            </div>
        </div>
    );
}
