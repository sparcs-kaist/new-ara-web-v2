import Image from "next/image";
import { getBoardKoNameById } from "@/lib/types/post";
import { Notification } from "@/lib/types/notification";

function formatRelativeTime(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diff < 60) return `${diff}초 전`;
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)}일 전`;

  // 한 달 이상은 날짜로 표시
  return date.toLocaleDateString("ko-KR");
}

export function mapNotificationToItemProps(n: Notification): NotificationItemProps {
  const timestamp = formatRelativeTime(n.created_at);

  if (n.type === "chat_message" && n.related_chat_room) {
    return {
      type: n.type,
      isRead: n.is_read,
      title: n.title,
      content: n.content,
      tag: `[${n.related_chat_room.room_type}]`,
      showTag: true,
      showContent: true,
      showReply: true,
      showDetail: false,
      showTimestamp: true,
      // subcontent: 방 제목
      detail: n.related_chat_room.room_title,
      // reply: 최근 메시지 내용 (API에서 recent_message.message.content로 받아야 함)
      reply: n.related_chat_room.recent_message?.message_content ?? "",
      timestamp,
    };
  }
  if ((n.type === "article_commented" || n.type === "comment_commented") && n.related_article) {
    return {
      type: n.type,
      isRead: n.is_read,
      title: n.title,
      content: n.content,
      tag: `[${getBoardKoNameById(n.related_article.parent_board)}]`,
      showTag: true,
      showContent: true,
      showReply: true,
      showDetail: false,
      showTimestamp: true,
      // subcontent: 게시글 제목
      detail: n.related_article.title,
      // reply: 댓글/대댓글 내용
      reply: n.type === "article_commented"
        ? n.content
        : n.related_comment?.content ?? "",
      timestamp,
    };
  }
  // fallback
  return {
    type: n.type,
    isRead: n.is_read,
    title: n.title,
    content: n.content,
    showTag: false,
    showContent: true,
    showReply: false,
    showDetail: false,
    showTimestamp: true,
    timestamp,
  };
}

// NotificationItemProps에 timestamp 추가
export interface NotificationItemProps {
  // API 에서 받아오는 data관련 Props
  type: string;
  isRead: boolean;
  title : string;
  content : string;
  tag? : string;
  detail? : string;
  reply? : string;

  showIcon?: boolean;
  showTag?: boolean;
  showDetail?: boolean;
  showContent?: boolean;
  showTimestamp?: boolean;
  showReply?: boolean;

  // 분리된 내부 간격
  verticalSpacing?: number; // title-content, content-아래 영역 사이
  detailVerticalSpacing?: number; // detail/reply 영역 내부 세로 간격

  // 리스트 간 간격
  listSpacing?: number; // px 단위

  // font size 관련 props
  titleFontSize?: string;
  contentFontSize?: string;
  detailFontSize?: string;
  timestampFontSize?: string;
  replyFontSize?: string; // 추가

  // font weight 관련 props
  titleFontWeight?: string;
  contentFontWeight?: string;
  detailFontWeight?: string;
  timestampFontWeight?: string;
  replyFontWeight?: string;

  iconSize?: number; // 아이콘 사이즈(px)
  
  timestamp?: string;
}

export interface NotificationListProps {
  notifications: Notification[];
  listSpacing?: number;
  titleFontSize?: string;
  contentFontSize?: string;
  detailFontSize?: string;
  timestampFontSize?: string;
  replyFontSize?: string;
  titleFontWeight?: string;
  contentFontWeight?: string;
  detailFontWeight?: string;
  timestampFontWeight?: string;
  replyFontWeight?: string;
  verticalSpacing?: number;
  detailVerticalSpacing?: number;
  iconSize?: number;
  showIcon?: boolean;
  showTag?: boolean;
  showDetail?: boolean;
  showContent?: boolean;
  showTimestamp?: boolean;
  showReply?: boolean;
}

// 아이콘 경로를 타입별로 결정하는 함수
function getNotificationIcon(type: string, isRead: boolean): string {
  if (type === "article_commented") {
    return isRead ? "/notification/comment_read.svg" : "/notification/comment.svg";
  }
  if (type === "comment_commented") {
    return isRead ? "/notification/recomment_read.svg" : "/notification/recomment.svg";
  }
  if (type === "chat_message") {
    return isRead ? "/notification/comment_read.svg" : "/notification/comment.svg";
  }
  return "/notification/comment.svg";
}

export function NotificationItem({
  type,
  isRead,
  showIcon = true,
  showTag = true,
  showDetail = true,
  showContent = true,
  showTimestamp = true,
  showReply = true,
  titleFontSize = "text-base",
  contentFontSize = "text-base",
  detailFontSize = "text-sm",
  timestampFontSize = "text-sm",
  replyFontSize = "text-sm",
  titleFontWeight = "font-bold",
  contentFontWeight = "font-medium",
  detailFontWeight = "font-medium",
  timestampFontWeight = "font-medium",
  replyFontWeight = "font-medium",
  verticalSpacing = 8,
  detailVerticalSpacing = 8,
  iconSize = 36,
  tag,
  detail,
  reply,
  content,
  title,
  timestamp,
}: NotificationItemProps) {
  const icon = getNotificationIcon(type, isRead);

  return (
    <div className="flex flex-col justify-center items-center w-full py-0">
      <div className="flex w-full justify-start items-center gap-4">
        {showIcon && (
          <div
            className={`rounded-2xl inline-flex flex-col justify-center items-center gap-2.5 overflow-hidden ${
              type === "article_commented" || type === "comment_commented"
                ? isRead
                  ? "bg-color-neutral-light1"
                  : "bg-color-brand-default"
                : "bg-color-neutral-light1"
            }`}
            style={{ width: iconSize, height: iconSize }}
          >
            <Image
              src={icon}
              alt="알림 아이콘"
              width={iconSize}
              height={iconSize}
              className="object-contain"
            />
          </div>
        )}
        <div className="flex-1 flex flex-col justify-center items-start min-w-0">
          <div className={`self-stretch ${titleFontSize} ${titleFontWeight} truncate${isRead ? " text-gray-400" : ""}`}>
            {title}
          </div>
          {showContent && (
            <div
              className={`self-stretch ${contentFontSize} ${contentFontWeight} truncate`}
              style={{ marginTop: verticalSpacing }}
            >
              {content}
            </div>
          )}
        </div>
        {showTimestamp && timestamp && (
          <div className={`w-20 text-right text-gray-400 ${timestampFontSize} ${timestampFontWeight}`}>
            {timestamp}
          </div>
        )}
      </div>
      {(showTag || showDetail || showReply) && (
        <div
          className="self-stretch flex items-center"
          style={{
            marginTop: verticalSpacing,
            columnGap: 8,
            paddingLeft: showIcon ?  (iconSize + 16) : 0,
          }}
        >
          <>
            {(showTag || showDetail) && (
              <div
                className="w-0 self-stretch outline outline-1 outline-offset-[-0.50px] outline-black"
                style={{
                  minWidth: 0,
                }}
              />
            )}
            <div
              className="flex-1 flex flex-col items-start min-w-0"
              style={{ rowGap: detailVerticalSpacing }}
            >
              {(showTag || showDetail) && (
                <div className="inline-flex items-start self-stretch min-w-0 gap-x-2">
                  {showTag && (
                    <div className={`text-xs text-gray-400 ${detailFontWeight}`}>
                      {tag}
                    </div>
                  )}
                  {showDetail && (
                    <div className={`flex-1 text-gray-600 text-xs ${detailFontWeight} truncate min-w-0 ${detailFontSize}`}>
                      {detail}
                    </div>
                  )}
                </div>
              )}
              {showReply && reply && (
                <div className={`self-stretch ${replyFontSize} ${replyFontWeight} truncate min-w-0`}>
                  {reply}
                </div>
              )}
            </div>
          </>
        </div>
      )}
    </div>
  );
}

// NotificationList 내부에서 각 표시 옵션을 NotificationItem에 전달하도록 수정
export default function NotificationList({
  notifications,
  listSpacing = 12,
  titleFontSize = "text-base",
  contentFontSize = "text-base",
  detailFontSize = "text-sm",
  timestampFontSize = "text-sm",
  replyFontSize = "text-sm",
  titleFontWeight = "font-bold",
  contentFontWeight = "font-medium",
  detailFontWeight = "font-medium",
  timestampFontWeight = "font-medium",
  replyFontWeight = "font-medium",
  verticalSpacing = 8,
  detailVerticalSpacing = 8,
  iconSize = 36,
  showIcon = true,
  showTag = true,
  showDetail = true,
  showContent = true,
  showTimestamp = true,
  showReply = true,
}: NotificationListProps) {
  const items = notifications.map(n => ({
    ...mapNotificationToItemProps(n),
    showIcon,
    showTag,
    showDetail,
    showContent,
    showTimestamp,
    showReply,
    titleFontSize,
    contentFontSize,
    detailFontSize,
    timestampFontSize,
    replyFontSize,
    titleFontWeight,
    contentFontWeight,
    detailFontWeight,
    timestampFontWeight,
    replyFontWeight,
    verticalSpacing,
    detailVerticalSpacing,
    iconSize,
  }));

  return (
    <div className="flex flex-col rounded-[5px] bg-white overflow-y-auto py-4">
      <ul className="flex-1 flex flex-col">
        {items.map((item, idx) => (
          <li key={idx} style={{ marginBottom: idx < items.length - 1 ? listSpacing : 0 }}>
            <NotificationItem {...item} />
          </li>
        ))}
      </ul>
    </div>
  );
}