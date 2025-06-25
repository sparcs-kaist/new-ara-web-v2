import Link from "next/link";
import Like from "@/components/ArticleList/Like";
import Image from "next/image";

// `BoardPreviewPost` -> `Article`로 이름 변경
interface Article {
  id: number;
  title: string;
  author: string;
  boardName?: string;
  likes: number;
  dislikes: number;
  comments: number;
  rank?: number;
  answered?: boolean;
  timeAgo?: string;
  hit?: number;
  profileImage?: string;
  hasAttachment?: boolean;
  attachmentType?: 'image' | 'file' | 'both';
}

// `BoardPreviewProps` -> `ArticleListProps`로 이름 변경
interface ArticleListProps {
  posts: Article[]; // 타입도 `Article`로 변경
  showWriter?: boolean; // 작성자 표시
  showBoard?: boolean; // 게시판 표시
  showProfile?: boolean; // 작성자 프로필 표시
  showHit?: boolean; // 조회수 표시
  showStatus?: boolean; // 통계(좋아요/싫어요/댓글) 표시
  showAttachment?: boolean; // 첨부파일 표시
  showRank?: boolean; // 순위 표시 (인기글)
  showAnswerStatus?: boolean; // 답변 상태 표시
  showTimeAgo?: boolean; // 시간 표시
  titleFontSize?: string; // 제목 폰트 크기 (Tailwind 클래스)
  titleFontWeight?: string; // 제목 폰트 굵기 (Tailwind 클래스)
}

// 컴포넌트 이름을 `ArticleList`로 변경
export default function ArticleList({ 
  posts, 
  showWriter = true,
  showBoard = false,
  showProfile = false,
  showHit = false,
  showStatus = true,
  showAttachment = true,
  showRank = false,
  showAnswerStatus = false,
  showTimeAgo = true,
  titleFontSize = "text-base",
  titleFontWeight = "font-normal"
}: ArticleListProps) { // Props 타입도 `ArticleListProps`로 변경
  // 메타데이터가 표시되는지 확인
  const hasMetadata = showWriter || showBoard || showAnswerStatus;
  
  // 하단 컨텐츠(두 번째 라인)가 있는지 확인 - Status만 있는 경우는 제외
  const hasBottomContent = hasMetadata;
  
  // 높이 계산: 하단 컨텐츠가 없으면 더 작게
  const itemHeight = hasBottomContent ? "h-[56px]" : "h-[40px]";
  
  return (
    <ul className="space-y-2">
      {posts.map((post, index) => (
        <li key={post.id} className={`border-b border-gray-200 ${hasBottomContent ? 'pb-2' : 'pb-1'} ${itemHeight} last:border-b-0`}>
          <Link href={`/post/${post.id}`} className="block h-full">
            <div className="flex items-center h-full">
              {showRank && (
                <span className="text-[22px] font-bold text-ara_red mr-3 flex-shrink-0">
                  {index + 1}
                </span>
              )}
              {showProfile && (
                <Image 
                  src={post.profileImage || "/assets/ServiceAra.svg"} 
                  alt="profile" 
                  width={40} 
                  height={40} 
                  className="rounded-full mr-3 flex-shrink-0"
                />
              )}
              
              <div className="w-full flex flex-col justify-center min-w-0">
                {/* 첫 번째 라인: Title + Attachment + TimeAgo + Hit + (메타데이터가 없으면) Status */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 flex-1 min-w-0">
                    <span 
                      className={`overflow-hidden whitespace-nowrap text-ellipsis ${titleFontSize} ${titleFontWeight}`} // Tailwind 클래스 적용
                      title={post.title} // 호버 시 전체 제목 표시
                    >
                      {post.title}
                    </span>
                    {showAttachment && post.hasAttachment && (
                      <Image 
                        src="/Image.svg" 
                        alt="첨부파일" 
                        width={17} 
                        height={14.22} 
                        className="flex-shrink-0"
                      />
                    )}
                  </div>
                  
                  {/* 오른쪽 정렬: TimeAgo + Hit + (메타데이터가 없으면) Status */}
                  <div className="flex items-center text-[12px] text-gray-500 ml-2 flex-shrink-0">
                    {[
                      showTimeAgo && post.timeAgo && post.timeAgo,
                      showHit && post.hit !== undefined && `조회 ${post.hit}`
                    ]
                      .filter(Boolean)
                      .map((item, index, array) => (
                        <span key={index}>
                          {item}
                          {index < array.length - 1 && <span className="mx-1">·</span>}
                        </span>
                      ))
                    }
                    
                    {/* 메타데이터가 없으면 Status를 첫 번째 라인에 표시 */}
                    {!hasBottomContent && showStatus && (
                      <>
                        {(showTimeAgo && post.timeAgo) || (showHit && post.hit !== undefined) ? 
                          <span className="mx-1">·</span> : null
                        }
                        <Like like={post.likes} dislike={post.dislikes} comment={post.comments} />
                      </>
                    )}
                  </div>
                </div>
                
                {/* 두 번째 라인: Writer + Board + AnswerStatus vs Status (메타데이터가 있을 때만) */}
                {hasBottomContent && (
                  <div className="flex w-full mt-1 justify-between items-center">
                    <div className="text-[12px] text-gray-500 flex items-center min-w-0 flex-1">
                      {/* 메타데이터를 배열로 구성하여 조건부 중간점 처리 */}
                      {[
                        showBoard && post.boardName ? post.boardName : null,
                        showWriter && post.author ? post.author : null,
                        showAnswerStatus ? (post.answered ? '답변 완료' : '답변 대기중') : null
                      ]
                        .filter(Boolean) // falsy 값 제거
                        .map((item, index, array) => (
                          <span key={index} className={`
                            ${showAnswerStatus && index === array.length - 1 
                              ? (post.answered ? 'text-blue-600' : 'text-red-600')
                              : 'text-gray-500'
                            } 
                            ${index === 0 ? 'overflow-hidden whitespace-nowrap text-ellipsis' : ''}
                          `}>
                            {item}
                            {index < array.length - 1 && <span className="mx-1">·</span>}
                          </span>
                        ))
                      }
                    </div>
                    
                    {/* 오른쪽 정렬: Status */}
                    <div className="flex items-center flex-shrink-0 ml-2">
                      {showStatus && (
                        <Like like={post.likes} dislike={post.dislikes} comment={post.comments} />
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}