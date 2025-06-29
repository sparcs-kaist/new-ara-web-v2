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
  showReadStatus?: boolean;
  titleFontSize?: string;
  titleFontWeight?: string;
  showTopic?: boolean;
  pagination?: boolean;
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  pageSize?: number;

  gapBetweenPosts?: number; // 게시글들 사이 간격
  gapBetweenTitleAndMeta?: number; // 제목과 메타데이터 사이 간격
}

const hiddenReasonText: Record<string, string> = {
  ADULT_CONTENT: "성인/음란성 게시글 입니다.",
  SOCIAL_CONTENT: "정치/사회성 게시글 입니다.",
  REPORTED_CONTENT: "신고 누적으로 차단된 게시물 입니다.",
  BLOCKED_USER_CONTENT: "차단한 유저의 게시물 입니다.",
  ACCESS_DENIED_CONTENT: "접근 권한이 없는 게시물 입니다.",
};

export default function ArticleList({ 
  posts, // 게시글 목록
  showWriter = false, // 작성자 표시
  showBoard = false, // 게시판 표시
  showProfile = false, // 작성자 프로필 사진 표시
  showHit = false, // 조회수 표시
  showStatus = false, // 좋아요, 싫어요, 댓글 수 표시
  showAttachment = false, // 첨부 파일 여부 표시
  showRank = false, // 순번 표시
  showAnswerStatus = false, // (학교에게 전합니다) 답변 상태 표시
  showTimeAgo = false, // 작성 시간 표시
  showReadStatus = false, // 읽은 글 회색 처리
  titleFontSize = "text-base", // 제목 폰트 사이즈
  titleFontWeight = "font-medium", // 제목 폰트 굵기
  showTopic = false, // 말머리 표시
  pagination = false, // 페이지네이션 표시
  currentPage = 1, // 현재 페이지
  pageSize = 10, // 페이지당 게시글 수
  totalPages = 1, // 전체 페이지 수
  onPageChange, // 페이지 변경 핸들러
  gapBetweenPosts = 8, // 게시글들 사이 간격 (px 단위)
  gapBetweenTitleAndMeta = 4, // 제목과 메타데이터 사이 간격 (px 단위)
}: ArticleListProps) {
  const hasMetadata = showWriter || showBoard || showAnswerStatus;
  const hasBottomContent = hasMetadata;
  const itemHeight = hasBottomContent ? "h-[56px]" : "h-[40px]";

  const formatTimeAgo = (dateString: string) => {
    try {
      const formattedTime = formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: ko });
      return formattedTime.replace(/(약 )|( 미만)|(이상)|(거의 )/g, '');
    } catch (e) {
      console.error("시간 포맷팅 오류:", e);
      return '';
    }
  };

  return (
    <>
      <ul style={{ paddingBottom: `${gapBetweenPosts}px` }}>
        {posts.map((post, index) => {
          const rank = (currentPage - 1) * pageSize + index + 1;
          const hasAttachment = post.attachment_type !== 'NONE';
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

          let displayTitle = post.title;
          let isHiddenTitle = false;
          if ((!displayTitle || displayTitle.trim() === "") && post.why_hidden && post.why_hidden.length > 0) {
            const reason = post.why_hidden[0];
            displayTitle = hiddenReasonText[reason] || "숨김 처리된 게시물 입니다.";
            isHiddenTitle = true;
          }

          const titleTextColor =
            isHiddenTitle
              ? 'text-gray-400'
              : (showReadStatus && post.read_status === '-' ? 'text-gray-500' : 'text-black');

          const topicName = showTopic && post.parent_topic ? post.parent_topic.ko_name : null;

          return (
            <li
              key={post.id}
              className={`border-b border-gray-200 last:border-b-0`}
              style={{ paddingBottom: `${gapBetweenPosts}px`,
                       paddingTop: `${gapBetweenPosts}px` }}
            >
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
                          {topicName && (
                            <span className="text-ara_red font-medium mr-2 flex-shrink-0">
                              [{topicName}]
                            </span>
                          )}
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
                        {[ showTimeAgo && timeAgo, showHit && post.hit_count !== undefined && `조회 ${post.hit_count}` ]
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
                            {(showTimeAgo && timeAgo) || (showHit && post.hit_count !== undefined) ? <span className="mx-1">·</span> : null}
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
                      <div className={`flex w-full justify-between items-center`} style={{ marginTop: `${gapBetweenTitleAndMeta}px` }}>
                        <div className="text-[12px] text-gray-500 flex items-center min-w-0 flex-1">
                          {[ showBoard && post.parent_board?.ko_name, showWriter && post.created_by?.profile?.nickname, showAnswerStatus && answerStatusText ]
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

      {pagination && totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-4 select-none">
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
                ${currentPage <= 10 ? 'grayscale brightness-100' : 'grayscale brightness-50'}`}
            />
          </button>

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
