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
}

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
  showReadStatus = true, // 기본값은 true (읽은 글 스타일 적용)
  titleFontSize = "text-base",
  titleFontWeight = "font-normal"
}: ArticleListProps) {
  const hasMetadata = showWriter || showBoard || showAnswerStatus;
  const hasBottomContent = hasMetadata;
  const itemHeight = hasBottomContent ? "h-[56px]" : "h-[40px]";

  // 시간 포맷팅 함수
  const formatTimeAgo = (dateString: string) => {
    try {
      const formattedTime = formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: ko });
      return formattedTime.replace(/(약 )|( 미만)/g, ''); // "약 "과 " 미만" 텍스트 제거
    } catch (e) {
      return '';
    }
  };

  return (
    <ul className="space-y-2">
      {posts.map((post, index) => {
        // ResponsePost에서 필요한 값 추출
        const hasAttachment = post.attachment_type !== 'NONE';
        const answered = post.communication_article_status > 0;
        const answerStatusText = answered 
          ? (post.communication_article_status === 2 ? '답변 완료' : '소통중') 
          : '답변 대기중';
        const answerStatusColor = answered 
          ? (post.communication_article_status === 2 ? 'text-blue-600' : 'text-yellow-600') 
          : 'text-red-600';
        const profileImage = post.created_by?.profile?.picture || "/assets/ServiceAra.svg";
        const timeAgo = post.created_at ? formatTimeAgo(post.created_at) : '';

        // 제목 텍스트 색상 결정
        const titleTextColor = showReadStatus && post.read_status === '-' ? 'text-gray-500' : 'text-black';

        return (
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
                    src={profileImage} 
                    alt="profile" 
                    width={40} 
                    height={40} 
                    className="rounded-full mr-3 flex-shrink-0"
                  />
                )}
                
                <div className="w-full flex flex-col justify-center min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 flex-1 min-w-0">
                      <span 
                        className={`overflow-hidden whitespace-nowrap text-ellipsis ${titleFontSize} ${titleFontWeight} ${titleTextColor}`}
                        title={post.title}
                      >
                        {post.title}
                      </span>
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
                          showAnswerStatus ? answerStatusText : null
                        ]
                          .filter(Boolean)
                          .map((item, i, arr) => (
                            <span key={i} className={`
                              ${showAnswerStatus && i === arr.length - 1 ? answerStatusColor : 'text-gray-500'} 
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
  );
}