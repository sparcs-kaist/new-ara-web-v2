"use client";

import SearchBar from "@/components/searchBar";
import BoardPreview from "@/components/BoardPreview/BoardPreview";
import { useState } from "react";

// 옵션 타입 정의
interface UIOptions {
  showWriter: boolean;
  showBoard: boolean;
  showProfile: boolean;
  showHit: boolean;
  showStatus: boolean;
  showAttachment: boolean;
  showRank: boolean;
  showAnswerStatus: boolean;
  showTimeAgo: boolean;
}

// 옵션 컨트롤 컴포넌트 타입 정의
interface OptionControlProps {
  options: UIOptions;
  onChange: (option: string, value: boolean) => void;
  containerWidth: number;
  onWidthChange: (width: number) => void;
  titleFontSize: string;
  onFontSizeChange: (size: string) => void;
  titleFontWeight: string;
  onFontWeightChange: (weight: string) => void;
}

// 옵션 컨트롤 컴포넌트
const OptionControl = ({ 
  options, 
  onChange, 
  containerWidth, 
  onWidthChange, 
  titleFontSize, 
  onFontSizeChange, 
  titleFontWeight, 
  onFontWeightChange 
}: OptionControlProps) => {
  return (
    <div className="p-4 bg-white rounded-lg shadow-sm mb-4 border border-gray-200">
      <h3 className="text-lg font-bold mb-3">UI 옵션 설정</h3>
      
      {/* 크기 조정 슬라이더 */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <label className="block text-sm font-medium mb-2">
          컨테이너 너비: {containerWidth}px
        </label>
        <input
          type="range"
          min="300"
          max="800"
          value={containerWidth}
          onChange={(e) => onWidthChange(parseInt(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>300px</span>
          <span>550px (기본)</span>
          <span>800px</span>
        </div>
      </div>

      {/* 폰트 크기 조정 드롭다운 */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <label className="block text-sm font-medium mb-2">
          제목 폰트 크기: {titleFontSize}
        </label>
        <select
          value={titleFontSize}
          onChange={(e) => onFontSizeChange(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-lg"
        >
          <option value="text-sm">Small</option>
          <option value="text-base">Base</option>
          <option value="text-lg">Large</option>
          <option value="text-xl">Extra Large</option>
          <option value="text-2xl">2XL</option>
        </select>
      </div>

      {/* 폰트 굵기 조정 드롭다운 */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <label className="block text-sm font-medium mb-2">
          제목 폰트 굵기: {titleFontWeight}
        </label>
        <select
          value={titleFontWeight}
          onChange={(e) => onFontWeightChange(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-lg"
        >
          <option value="font-normal">Normal</option>
          <option value="font-bold">Bold</option>
          <option value="font-light">Light</option>
          <option value="font-medium">Medium</option>
          <option value="font-extrabold">Extra Bold</option>
        </select>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {Object.entries(options).map(([key, value]) => (
          <div key={key} className="flex items-center">
            <input
              type="checkbox"
              id={key}
              checked={value}
              onChange={() => onChange(key, !value)}
              className="mr-2"
            />
            <label htmlFor={key} className="text-sm">
              {key.replace('show', '')}
            </label>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function Home() {
  const [inputValue, setInputValue] = useState("");
  const [containerWidth, setContainerWidth] = useState(550); // 기본 크기
  const [titleFontSize, setTitleFontSize] = useState("text-base"); // 기본 폰트 크기
  const [titleFontWeight, setTitleFontWeight] = useState("font-normal"); // 기본 폰트 굵기
  
  // UI 옵션 상태 관리
  const [uiOptions, setUiOptions] = useState<UIOptions>({
    showWriter: true,
    showBoard: true,
    showProfile: false,
    showHit: true,
    showStatus: true, 
    showAttachment: true,
    showRank: false,
    showAnswerStatus: false,
    showTimeAgo: true
  });
  
  // UI 옵션 변경 핸들러
  const handleOptionChange = (option: string, value: boolean) => {
    setUiOptions(prev => ({
      ...prev,
      [option]: value
    }));
  };

  // 테스트 데이터
  const testPosts = [
    { 
      id: 1, 
      title: "이것은 매우 긴 게시글 제목입니다. 실제로는 이보다 더 길 수도 있고 말줄임표(...) 처리가 잘 되는지 확인해보겠습니다", 
      author: "개발자", 
      timeAgo: "9분 전", 
      likes: 50, 
      dislikes: 2, 
      comments: 15,
      boardName: "개발 게시판",
      hasAttachment: true,
      attachmentType: 'image' as const,
      hit: 230,
      answered: true,
      profileImage: "/assets/ServiceAra.svg"
    },
    { 
      id: 2, 
      title: "UI 옵션을 변경해보세요!", 
      author: "디자이너", 
      timeAgo: "20분 전", 
      likes: 40, 
      dislikes: 3, 
      comments: 10,
      boardName: "디자인 게시판",
      hasAttachment: false,
      hit: 185,
      answered: false
    },
    { 
      id: 3, 
      title: "프로필 이미지와 순위 표시 테스트 - 이 제목도 상당히 길게 만들어서 말줄임 처리를 확인해보겠습니다", 
      author: "테스터", 
      timeAgo: "1시간 전", 
      likes: 35, 
      dislikes: 1, 
      comments: 8,
      boardName: "테스트 게시판",
      hasAttachment: true,
      attachmentType: 'both' as const,
      hit: 142,
      answered: true,
      profileImage: "/assets/ServiceAra.svg"
    },
    { 
      id: 4, 
      title: "첨부파일 표시 기능 확인", 
      author: "사용자", 
      timeAgo: "2시간 전", 
      likes: 25, 
      dislikes: 0, 
      comments: 5,
      boardName: "일반 게시판",
      hasAttachment: true,
      attachmentType: 'file' as const,
      hit: 98,
      answered: false
    }
  ];

  return (
    <div className="max-w-[1200px] mx-auto">
      <div className="absolute top-0 left-0 w-full h-[400px] bg-gradient-to-b from-[#FFEDD2] to-[#FFFFFF] -z-10"></div>
      
      <div className="h-[220px] w-full flex justify-center items-center">
        <SearchBar
          value={inputValue}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInputValue(e.target.value)}
        />
      </div>
      
      {/* UI 옵션 컨트롤 */}
      <div className="mb-6">
        <OptionControl 
          options={uiOptions} 
          onChange={handleOptionChange}
          containerWidth={containerWidth}
          onWidthChange={setContainerWidth}
          titleFontSize={titleFontSize}
          onFontSizeChange={setTitleFontSize}
          titleFontWeight={titleFontWeight}
          onFontWeightChange={setTitleFontWeight}
        />
      </div>
      
      {/* 게시판 프리뷰 테스트 영역 */}
      <div className="flex justify-center">
        <div 
          className="p-6 border border-gray-200 rounded-[20px] shadow-sm bg-white transition-all duration-300"
          style={{ width: `${containerWidth + 48}px` }} // padding 24px * 2 = 48px 추가
        >
          <BoardPreview
            boardTitle="🧪 게시판 컴포넌트 테스트"
            posts={testPosts}
            boardLink="/board/test"
            containerWidth={containerWidth}
            titleFontSize={titleFontSize}
            titleFontWeight={titleFontWeight}
            {...uiOptions}
          />
        </div>
      </div>
    </div>
  );
}
