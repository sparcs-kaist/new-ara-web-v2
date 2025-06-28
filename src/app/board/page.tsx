'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

// 보드 설정 타입 정의
interface BoardConfig {
  id: number;
  name: string;
  path: string;
  description?: string;
}

// 보드 설정 데이터
const boardConfigs: BoardConfig[] = [
  { id: 1, name: '포탈 공지', path: 'portal-notice', description: 'KAIST 포탈 공지사항' },
  { id: 2, name: '학생 단체', path: 'students-group', description: '학생 단체 관련 게시판' },
  { id: 3, name: '구인구직', path: 'wanted', description: '구인구직 정보 게시판' },
  { id: 4, name: '장터', path: 'market', description: '중고거래 및 장터 게시판' },
  { id: 5, name: '입주 업체 피드백', path: 'facility-feedback', description: '입주 업체 피드백 게시판' },
  { id: 7, name: '자유게시판', path: 'talk', description: '자유로운 주제의 게시판' },
  { id: 8, name: '운영진 공지', path: 'ara-notice', description: '아라 운영진 공지사항' },
  { id: 10, name: '아라 피드백', path: 'ara-feedback', description: '아라 서비스 피드백' },
  { id: 11, name: '입주 업체 공지', path: 'facility-notice', description: '입주 업체 공지사항' },
  { id: 12, name: '동아리', path: 'club', description: '동아리 관련 게시판' },
  { id: 13, name: '부동산', path: 'real-estate', description: '부동산 정보 게시판' },
  { id: 14, name: '학교에게 전합니다', path: 'with-school', description: '학교 관련 건의사항' },
  { id: 17, name: '카이스트 뉴스', path: 'kaist-news', description: 'KAIST 관련 뉴스' },
  { id: 18, name: '외부 업체 홍보', path: 'external-company-advertisement', description: '외부 업체 홍보 게시판' }
];

// 보드 ID로 설정 찾기
export const getBoardConfigById = (boardId: number): BoardConfig | undefined => {
  return boardConfigs.find(config => config.id === boardId);
};

// 경로로 보드 ID 찾기
export const getBoardIdByPath = (path: string): number | undefined => {
  const config = boardConfigs.find(config => config.path === path);
  return config?.id;
};

// 인기글 게시판은 별도 처리 (board_id 없음)
export const POPULAR_BOARD = {
  name: '인기글',
  path: 'popular',
  description: '인기있는 게시글 모음'
};

export default function Board() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedBoard, setSelectedBoard] = useState<BoardConfig | null>(null);
  const [currentBoardType, setCurrentBoardType] = useState<'all' | 'popular' | 'board'>('all');
  
  // API 호출을 위한 board_id 상태
  const [currentBoardId, setCurrentBoardId] = useState<number | null>(null);

  useEffect(() => {
    // URL 쿼리 파라미터에서 보드 타입 확인
    const boardParam = searchParams.get('board');
    
    if (!boardParam) {
      // board 파라미터가 없으면 전체보기
      setCurrentBoardType('all');
      setSelectedBoard(null);
      setCurrentBoardId(null);
    } else if (boardParam === 'popular') {
      // 인기글 페이지
      setCurrentBoardType('popular');
      setSelectedBoard(null);
      setCurrentBoardId(null);
    } else {
      // 특정 보드 페이지
      const config = boardConfigs.find(config => config.path === boardParam);
      if (config) {
        setCurrentBoardType('board');
        setSelectedBoard(config);
        setCurrentBoardId(config.id);
      } else {
        // 존재하지 않는 보드면 전체보기로 리다이렉트
        router.push('/board');
      }
    }
  }, [searchParams, router]);

  // API 호출 함수 (예시)
  const fetchBoardData = async () => {
    if (currentBoardType === 'all') {
      console.log('전체 게시판 데이터 호출');
      // API: /api/articles (board_id 파라미터 없음)
    } else if (currentBoardType === 'popular') {
      console.log('인기글 데이터 호출');
      // API: /api/articles?type=popular
    } else if (currentBoardId) {
      console.log(`보드 ${currentBoardId} 데이터 호출`);
      // API: /api/articles?board_id=${currentBoardId}
    }
  };

  useEffect(() => {
    fetchBoardData();
  }, [currentBoardType, currentBoardId]);

  const handleBoardSelect = (config: BoardConfig) => {
    router.push(`/board?board=${config.path}`);
  };

  const handlePopularBoard = () => {
    router.push('/board?board=popular');
  };

  const handleAllBoard = () => {
    router.push('/board');
  };

  const getCurrentTitle = () => {
    if (currentBoardType === 'popular') return POPULAR_BOARD.name;
    if (selectedBoard) return selectedBoard.name;
    return '전체보기';
  };

  const getCurrentDescription = () => {
    if (currentBoardType === 'popular') return POPULAR_BOARD.description;
    if (selectedBoard) return selectedBoard.description;
    return '모든 게시판의 글을 한번에 볼 수 있습니다';
  };

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

        {/* 보드 네비게이션 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">게시판 목록</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* 전체보기 */}
            <button
              onClick={handleAllBoard}
              className={`p-4 rounded-lg border text-left transition-colors ${
                currentBoardType === 'all'
                  ? 'border-blue-500 bg-blue-50 text-blue-700' 
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="font-medium">전체보기</div>
              <div className="text-sm text-gray-500">모든 게시판</div>
            </button>

            {/* 인기글 */}
            <button
              onClick={handlePopularBoard}
              className={`p-4 rounded-lg border text-left transition-colors ${
                currentBoardType === 'popular'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="font-medium">{POPULAR_BOARD.name}</div>
              <div className="text-sm text-gray-500">{POPULAR_BOARD.description}</div>
            </button>

            {/* 각 보드별 버튼 */}
            {boardConfigs.map((config) => (
              <button
                key={config.id}
                onClick={() => handleBoardSelect(config)}
                className={`p-4 rounded-lg border text-left transition-colors ${
                  selectedBoard?.id === config.id
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="font-medium">{config.name}</div>
                <div className="text-sm text-gray-500">{config.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* 현재 보드 정보 및 콘텐츠 */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          {/* 보드 정보 헤더 */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">
                {getCurrentTitle()}
                {selectedBoard && ` (Board ID: ${selectedBoard.id})`}
              </h3>
              <p className="text-gray-600 mt-1">{getCurrentDescription()}</p>
            </div>
            
            {/* API 정보 */}
            <div className="text-right">
              <div className="text-sm text-gray-500 mb-1">API 호출</div>
              <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                {currentBoardType === 'all' && 'board_id 없음'}
                {currentBoardType === 'popular' && 'type=popular'}
                {currentBoardId && `board_id=${currentBoardId}`}
              </code>
            </div>
          </div>

          {/* 게시글 목록 영역 */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-800">게시글 목록</h4>
            
            {/* 여기에 실제 게시글 목록이 들어갈 예정 */}
            <div className="bg-gray-50 rounded-lg p-8 text-center text-gray-500">
              <p className="mb-2">게시글 목록이 여기에 표시됩니다</p>
              <p className="text-sm">
                현재 보드 타입: <strong>{currentBoardType}</strong>
                {currentBoardId && ` | Board ID: ${currentBoardId}`}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
