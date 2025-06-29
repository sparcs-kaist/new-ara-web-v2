import Link from "next/link";
import Like from "@/components/ArticleList/Like";
import Image from "next/image";
import { ResponsePost } from "@/lib/types/post";
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

interface ArticleListProps {
  posts: ResponsePost[];
  showWriter?: boolean;
  showBoard?: boolean;
  showProfile?: boolean;
  showHit?: boolean;
  showStatus?: boolean;
  showAttachment?: boolean;
  showRank?: boolean;
  showAnswerStatus?: boolean;
  showTimeAgo?: boolean;
  showReadStatus?: boolean; // 읽은 글 스타일 적용 여부
  titleFontSize?: string;
  titleFontWeight?: string;
  showTopic?: boolean; //말머리 표시 여부
  pagination?: boolean; // 페이지네이션 표시 여부
  currentPage?: number; // 현재 페이지
  totalPages?: number; //전체 페이지
  onPageChange?: (page: number) => void;
  pageSize?: number; // 추가: 페이지당 게시물 수
}

// 숨김 사유별 대체 텍스트 매핑
const hiddenReasonText: Record<string, string> = {
  ADULT_CONTENT: "성인/음란성 게시글 입니다.",
  SOCIAL_CONTENT: "정치/사회성 게시글 입니다.",
  REPORTED_CONTENT: "신고 누적으로 차단된 게시물 입니다.",
  BLOCKED_USER_CONTENT: "차단한 유저의 게시물 입니다.",
  ACCESS_DENIED_CONTENT: "접근 권한이 없는 게시물 입니다.",
};

export default function ArticleList({ 
  posts, 
  showWriter = false,
  showBoard = false,
  showProfile = false,
  showHit = false,
  showStatus = false,
  showAttachment = false,
  showRank = false,
  showAnswerStatus = false,
  showTimeAgo = false,
  showReadStatus = false,
  titleFontSize = "text-base",
  titleFontWeight = "font-medium",
  showTopic = false,
  pagination = false,
  currentPage = 1,
  pageSize = 10, // 추가: 기본값 10
  totalPages = 1,
  onPageChange,
}: ArticleListProps) {
  const hasMetadata = showWriter || showBoard || showAnswerStatus;
  const hasBottomContent = hasMetadata;
  const itemHeight = hasBottomContent ? "h-[56px]" : "h-[40px]";

  // 시간 포맷팅 함수
  const formatTimeAgo = (dateString: string) => {
    try {
      const formattedTime = formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: ko });
      return formattedTime.replace(/(약 )|( 미만)|(이상)|(거의 )/g, ''); // "약 ", " 미만", "이상", "거의 " 텍스트 제거
    } catch (e) {
      console.error("시간 포맷팅 오류:", e);
      return '';
    }
  };

  return (
    <>
      <ul className="space-y-2">
        {posts.map((post, index) => {
          // 페이지네이션을 고려한 rank 계산
          const rank = (currentPage - 1) * pageSize + index + 1;
          
          // ResponsePost에서 필요한 값 추출
          const hasAttachment = post.attachment_type !== 'NONE';
          
          // communication_article_status가 null인 경우 처리
          const hasAnswerStatus = post.communication_article_status !== null;
          const answered = hasAnswerStatus && post.communication_article_status !== null && post.communication_article_status > 0;
          const answerStatusText = hasAnswerStatus
            ? (answered
                ? (post.communication_article_status === 2 ? '답변 완료' : '소통중') 
                : '답변 대기중')
            : null;
          const answerStatusColor = hasAnswerStatus
            ? (answered
                ? (post.communication_article_status === 2 ? 'text-blue-600' : 'text-yellow-600') 
                : 'text-red-600')
            : '';
          
          const profileImage = post.created_by?.profile?.picture || "/assets/ServiceAra.svg";
          const timeAgo = post.created_at ? formatTimeAgo(post.created_at) : '';

          // 숨김 처리된 게시물 제목 대체 및 색상 결정
          let displayTitle = post.title;
          let isHiddenTitle = false;
          if ((!displayTitle || displayTitle.trim() === "") && post.why_hidden && post.why_hidden.length > 0) {
            const reason = post.why_hidden[0];
            displayTitle = hiddenReasonText[reason] || "숨김 처리된 게시물 입니다.";
            isHiddenTitle = true;
          }

          // 제목 텍스트 색상 결정
          const titleTextColor =
            isHiddenTitle
              ? 'text-gray-400' // 숨김 게시물은 옅은 회색
              : (showReadStatus && post.read_status === '-' ? 'text-gray-500' : 'text-black');

          // 말머리 정보 추출
          const topicName = showTopic && post.parent_topic ? post.parent_topic.ko_name : null;

          return (
            <li key={post.id} className={`border-b border-gray-200 ${hasBottomContent ? 'pb-2' : 'pb-1'} ${itemHeight} last:border-b-0`}>
              <Link href={`/post/${post.id}`} className="block h-full">
                <div className="flex items-center h-full">
                  {showRank && (
                    <span className="mr-4 text-ara_red font-bold text-xl">
                      {rank}
                    </span>
                  )}
                  {showProfile && (
                    <div
                      className="w-10 h-10 rounded-full overflow-hidden mr-4 flex-shrink-0 relative flex items-center justify-center bg-gray-100"
                      style={{ minWidth: 40, minHeight: 40 }}
                    >
                      {isHiddenTitle ? (
                        post.why_hidden?.[0] === "BLOCKED_USER_CONTENT" || post.why_hidden?.[0] === "REPORTED_CONTENT" ? (
                          <i className="material-icons text-gray-400 text-3xl">voice_over_off</i>
                        ) : (
                          <i className="material-icons text-gray-400 text-3xl">visibility_off</i>
                        )
                      ) : (
                        <Image
                          src={profileImage}
                          alt="profile"
                          width={40}
                          height={40}
                          className="object-cover w-full h-full"
                        />
                      )}
                    </div>
                  )}
                  
                  <div className="w-full flex flex-col justify-center min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 flex-1 min-w-0">
                        <div className="flex items-center min-w-0 flex-1">
                          {/* 말머리 표시 */}
                          {topicName && (
                            <span className="text-ara_red font-medium mr-2 flex-shrink-0">
                              [{topicName}]
                            </span>
                          )}
                          {/* 제목 */}
                          <span 
                            className={`overflow-hidden whitespace-nowrap text-ellipsis ${titleFontSize} ${titleFontWeight} ${titleTextColor} flex-1`}
                            title={displayTitle}
                          >
                            {displayTitle}
                          </span>
                        </div>
                        {showAttachment && hasAttachment && (
                          <Image 
                            src="/Image.svg" 
                            alt="첨부파일" 
                            width={17} 
                            height={14.22} 
                            className="flex-shrink-0"
                          />
                        )}
                      </div>
                      
                      <div className="flex items-center text-[12px] text-gray-500 ml-2 flex-shrink-0">
                        {[
                          showTimeAgo && timeAgo,
                          showHit && post.hit_count !== undefined && `조회 ${post.hit_count}`
                        ]
                          .filter(Boolean)
                          .map((item, i, arr) => (
                            <span key={i}>
                              {item}
                              {i < arr.length - 1 && <span className="mx-1">·</span>}
                            </span>
                          ))
                        }
                        
                        {!hasBottomContent && showStatus && (
                          <>
                            {(showTimeAgo && timeAgo) || (showHit && post.hit_count !== undefined) ? 
                              <span className="mx-1">·</span> : null
                            }
                            <Like 
                              like={post.positive_vote_count} 
                              dislike={post.negative_vote_count} 
                              comment={post.comment_count} 
                            />
                          </>
                        )}
                      </div>
                    </div>
                    
                    {hasBottomContent && (
                      <div className="flex w-full mt-1 justify-between items-center">
                        <div className="text-[12px] text-gray-500 flex items-center min-w-0 flex-1">
                          {[
                            showBoard && post.parent_board?.ko_name,
                            showWriter && post.created_by?.profile?.nickname,
                            showAnswerStatus && answerStatusText // answerStatusText가 null이면 표시하지 않음
                          ]
                            .filter(Boolean)
                            .map((item, i, arr) => (
                              <span key={i} className={`
                                ${showAnswerStatus && answerStatusText && i === arr.length - 1 ? answerStatusColor : 'text-gray-500'} 
                                ${i === 0 ? 'overflow-hidden whitespace-nowrap text-ellipsis' : ''}
                              `}>
                                {item}
                                {i < arr.length - 1 && <span className="mx-1">·</span>}
                              </span>
                            ))
                          }
                        </div>
                        
                        <div className="flex items-center flex-shrink-0 ml-2">
                          {showStatus && (
                            <Like 
                              like={post.positive_vote_count} 
                              dislike={post.negative_vote_count} 
                              comment={post.comment_count} 
                            />
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
      {/* 페이지네이션 UI */}
      {pagination && totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-4 select-none">
          {/* 이전 그룹(<) */}
          <button
            className="px-2 py-1 rounded"
            onClick={() => onPageChange && onPageChange(Math.max(1, Math.floor((currentPage - 1) / 10) * 10))}
            disabled={currentPage <= 10}
            aria-label="이전 10페이지"
          >
            <Image
              src="/Right_Chevron.svg"
              alt="이전"
              width={8}
              height={8}
              className={`rotate-180 transition
                ${currentPage <= 10
                  ? 'grayscale brightness-100'
                  : 'grayscale brightness-50'
                }`}
            />
          </button>
          {/* 숫자 버튼 */}
          {Array.from({ length: Math.min(10, totalPages - Math.floor((currentPage - 1) / 10) * 10) }).map((_, idx) => {
            const page = Math.floor((currentPage - 1) / 10) * 10 + idx + 1;
            return (
              <button
                key={page}
                className={`px-2 py-1 text-lg rounded ${page === currentPage ? 'text-ara_red font-bold' : 'text-gray-700 hover:bg-gray-100'}`}
                onClick={() => onPageChange && onPageChange(page)}
                disabled={page > totalPages}
              >
                {page}
              </button>
            );
          })}
          {/* 다음 그룹(>) */}
          <button
            className="px-2 py-1 rounded"
            onClick={() => onPageChange && onPageChange(Math.min(totalPages, Math.floor((currentPage - 1) / 10 + 1) * 10 + 1))}
            disabled={Math.floor((currentPage - 1) / 10) * 10 + 10 >= totalPages}
            aria-label="다음 10페이지"
          >
            <Image
              src="/Right_Chevron.svg"
              alt="다음"
              width={8}
              height={8}
              className={`transition
                ${Math.floor((currentPage - 1) / 10) * 10 + 10 >= totalPages
                  ? 'grayscale brightness-100'
                  : 'grayscale brightness-50'
                }`}
            />
          </button>
        </div>
      )}
    </>
  );
}