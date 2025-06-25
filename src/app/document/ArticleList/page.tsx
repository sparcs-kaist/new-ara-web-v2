"use client";

import ArticleList from "@/components/ArticleList/ArticleList";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ResponsePostList } from "@/lib/types/post";

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
  showReadStatus: boolean; // 읽은 글 스타일 적용 여부 추가
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
      
      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <label className="block text-sm font-medium mb-2">컨테이너 너비: {containerWidth}px</label>
        <input type="range" min="300" max="800" value={containerWidth} onChange={(e) => onWidthChange(parseInt(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
        <div className="flex justify-between text-xs text-gray-500 mt-1"><span>300px</span><span>550px (기본)</span><span>800px</span></div>
      </div>

      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <label className="block text-sm font-medium mb-2">제목 폰트 크기 (Tailwind): {titleFontSize}</label>
        <select value={titleFontSize} onChange={(e) => onFontSizeChange(e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg">
          <option value="text-xs">text-xs</option><option value="text-sm">text-sm</option><option value="text-base">text-base (기본)</option><option value="text-lg">text-lg</option><option value="text-xl">text-xl</option><option value="text-2xl">text-2xl</option>
        </select>
      </div>

      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <label className="block text-sm font-medium mb-2">제목 폰트 굵기 (Tailwind): {titleFontWeight}</label>
        <select value={titleFontWeight} onChange={(e) => onFontWeightChange(e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg">
          <option value="font-light">font-light</option><option value="font-normal">font-normal (기본)</option><option value="font-medium">font-medium</option><option value="font-semibold">font-semibold</option><option value="font-bold">font-bold</option>
        </select>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {Object.entries(options).map(([key, value]) => (
          <div key={key} className="flex items-center">
            <input type="checkbox" id={key} checked={value} onChange={() => onChange(key, !value)} className="mr-2" />
            <label htmlFor={key} className="text-sm">{key.replace('show', '')}</label>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function ArticleListDocumentPage() {
  const [containerWidth, setContainerWidth] = useState(550);
  const [titleFontSize, setTitleFontSize] = useState("text-base");
  const [titleFontWeight, setTitleFontWeight] = useState("font-normal");
  const [uiOptions, setUiOptions] = useState<UIOptions>({
    showWriter: true, 
    showBoard: true, 
    showProfile: false, 
    showHit: true, 
    showStatus: true, 
    showAttachment: true, 
    showRank: false, 
    showAnswerStatus: false, 
    showTimeAgo: true,
    showReadStatus: true // 읽은 글 스타일 적용 여부 추가 (기본값: true)
  });
  const handleOptionChange = (option: string, value: boolean) => {
    setUiOptions(prev => ({ ...prev, [option]: value }));
  };

  // API 응답 형태에 맞춘 모의 데이터
  const mockPostListResponse: ResponsePostList = {
    num_pages: 1,
    num_items: 4,
    current: 1,
    previous: null,
    next: null,
    results: [
      {
        id: 1,
        title: "이것은 매우 긴 게시글 제목입니다. 실제로는 이보다 더 길 수도 있고 말줄임표(...) 처리가 잘 되는지 확인해보겠습니다",
        created_by: {
          id: "1",
          username: "developer",
          profile: {
            nickname: "개발자",
            picture: "/assets/ServiceAra.svg",
            user: "1"
          }
        },
        parent_board: {
          id: 1,
          slug: "dev",
          ko_name: "개발 게시판",
          en_name: "Development",
          is_read_only: false,
          name_type: 1,
          group: {
            id: 1,
            ko_name: "일반",
            en_name: "General",
            slug: "general"
          },
          banner_image: "",
          ko_board_description: "",
          en_board_description: "",
          top_threshold: 10
        },
        positive_vote_count: 50,
        negative_vote_count: 2,
        comment_count: 15,
        communication_article_status: null,
        created_at: "2025-06-25T01:00:00Z",
        hit_count: 230,
        attachment_type: "IMAGE",
        // 그 외 필요한 필드들에 기본값 부여
        can_override_hidden: false,
        commented_at: "",
        content_updated_at: "",
        days_left: 0,
        deleted_at: "",
        hidden_at: "",
        name_type: 1,
        is_content_sexual: false,
        is_content_social: false,
        is_hidden: false,
        parent_topic: null,
        read_status: "-",
        report_count: 0,
        updated_at: "",
        url: "",
        why_hidden: []
      },
      {
        id: 2,
        title: "UI 옵션을 변경해보세요!",
        created_by: {
          id: "2",
          username: "designer",
          profile: {
            nickname: "디자이너",
            picture: "",
            user: "2"
          }
        },
        parent_board: {
          id: 2,
          slug: "design",
          ko_name: "디자인 게시판",
          en_name: "Design",
          is_read_only: false,
          name_type: 1,
          group: {
            id: 1,
            ko_name: "일반",
            en_name: "General",
            slug: "general"
          },
          banner_image: "",
          ko_board_description: "",
          en_board_description: "",
          top_threshold: 10
        },
        positive_vote_count: 40,
        negative_vote_count: 3,
        comment_count: 10,
        communication_article_status: 0,
        created_at: "2025-06-25T00:30:00Z",
        hit_count: 185,
        attachment_type: "NONE",
        // 그 외 필요한 필드들에 기본값 부여
        can_override_hidden: false,
        commented_at: "",
        content_updated_at: "",
        days_left: 0,
        deleted_at: "",
        hidden_at: "",
        name_type: 1,
        is_content_sexual: false,
        is_content_social: false,
        is_hidden: false,
        parent_topic: null,
        read_status: "N",
        report_count: 0,
        updated_at: "",
        url: "",
        why_hidden: []
      },
      {
        id: 3,
        title: "프로필 이미지와 순위 표시 테스트 - 이 제목도 상당히 길게 만들어서 말줄임 처리를 확인해보겠습니다",
        created_by: {
          id: "3",
          username: "tester",
          profile: {
            nickname: "테스터",
            picture: "/assets/ServiceAra.svg",
            user: "3"
          }
        },
        parent_board: {
          id: 3,
          slug: "test",
          ko_name: "테스트 게시판",
          en_name: "Test",
          is_read_only: false,
          name_type: 1,
          group: {
            id: 1,
            ko_name: "일반",
            en_name: "General",
            slug: "general"
          },
          banner_image: "",
          ko_board_description: "",
          en_board_description: "",
          top_threshold: 10
        },
        positive_vote_count: 35,
        negative_vote_count: 1,
        comment_count: 8,
        communication_article_status: 2,
        created_at: "2025-06-24T23:00:00Z",
        hit_count: 142,
        attachment_type: "BOTH",
        // 그 외 필요한 필드들에 기본값 부여
        can_override_hidden: false,
        commented_at: "",
        content_updated_at: "",
        days_left: 0,
        deleted_at: "",
        hidden_at: "",
        name_type: 1,
        is_content_sexual: false,
        is_content_social: false,
        is_hidden: false,
        parent_topic: null,
        read_status: "N",
        report_count: 0,
        updated_at: "",
        url: "",
        why_hidden: []
      },
      {
        id: 4,
        title: "첨부파일 표시 기능 확인",
        created_by: {
          id: "4",
          username: "user",
          profile: {
            nickname: "사용자",
            picture: "",
            user: "4"
          }
        },
        parent_board: {
          id: 4,
          slug: "general",
          ko_name: "일반 게시판",
          en_name: "General",
          is_read_only: false,
          name_type: 1,
          group: {
            id: 1,
            ko_name: "일반",
            en_name: "General",
            slug: "general"
          },
          banner_image: "",
          ko_board_description: "",
          en_board_description: "",
          top_threshold: 10
        },
        positive_vote_count: 25,
        negative_vote_count: 0,
        comment_count: 5,
        communication_article_status: null,
        created_at: "2025-06-24T22:00:00Z",
        hit_count: 98,
        attachment_type: "FILE",
        // 그 외 필요한 필드들에 기본값 부여
        can_override_hidden: false,
        commented_at: "",
        content_updated_at: "",
        days_left: 0,
        deleted_at: "",
        hidden_at: "",
        name_type: 1,
        is_content_sexual: false,
        is_content_social: false,
        is_hidden: false,
        parent_topic: null,
        read_status: "-",
        report_count: 0,
        updated_at: "",
        url: "",
        why_hidden: []
      }
    ]
  };

  return (
    <div className="max-w-[1200px] mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">ArticleList Component Document</h1>
      
      <div className="mb-6">
        <OptionControl 
          options={uiOptions} onChange={handleOptionChange} containerWidth={containerWidth} onWidthChange={setContainerWidth}
          titleFontSize={titleFontSize} onFontSizeChange={setTitleFontSize} titleFontWeight={titleFontWeight} onFontWeightChange={setTitleFontWeight}
        />
      </div>
      
      <div className="flex justify-center">
        <div className="w-full p-4 rounded-lg shadow-sm transition-all duration-300 bg-white border" style={{ maxWidth: `${containerWidth}px` }}>
          <Link href="#" className="flex items-center space-x-2 mb-[10px]">
            <h2 className="text-[20px] font-semibold">🧪 컴포넌트 테스트</h2>
            <Image src="/Right_Chevron.svg" width={8.84} height={15} alt="arrow" />
          </Link>
          <ArticleList 
            posts={mockPostListResponse.results} 
            titleFontSize={titleFontSize} 
            titleFontWeight={titleFontWeight} 
            {...uiOptions} 
          />
        </div>
      </div>
    </div>
  );
}