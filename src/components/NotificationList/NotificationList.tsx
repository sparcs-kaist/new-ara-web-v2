import Image from "next/image";

type NotificationType = "article_commented" | "comment_commented" | "chat_message";

interface NotificationConfig {
  icon: string;
  iconRead: string;
  title: string;
  content: string;
  tag: string;
  tagColor: string;
  detail: string;
  detailColor: string;
  time: string;
  timeRead: string;
  tagRead?: string;
  reply?: string;
  replyColor?: string;
}

const notificationConfig: Record<NotificationType, NotificationConfig> = {
  article_commented: {
    icon: "/notification/comment.svg",
    iconRead: "/notification/comment_read.svg",
    title: "회원님의 게시물에 새로운 댓글이 작성되었습니다.",
    content: "엄청나게 긴 댓글의 내용이라 댓글이 짤려 가지고 말이죠, 그래서 엄청나게 긴 댓글의 내용이라 댓글이 짤려 가지고 말이죠",
    tag: "[학교에게 전합니다]",
    tagColor: "text-gray-400",
    detail: "희망관 샤워실 유리 부스 교체 부탁드립니다.",
    detailColor: "text-gray-600",
    reply: "맞아요... 저도 유리에 다친 적이 있어요 ㅜㅜ 저 유리 빠르게 교체",
    time: "9분 전",
    timeRead: "9분 전",
  },
  comment_commented: {
    icon: "/notification/recomment.svg",
    iconRead: "/notification/recomment_read.svg",
    title: "회원님의 댓글에 새로운 대댓글이 작성되었습니다.",
    content: "엄청나게 긴 대댓글의 내용이라 대댓글이 짤려 가지고 말이죠, 그래서 엄청나게 긴 대댓글의 내용이라 대댓글이 짤려 가지고 말이죠",
    tag: "[학교에게 전합니다]",
    tagColor: "text-gray-400",
    detail: "희망관 샤워실 유리 부스 교체 부탁드립니다.",
    detailColor: "text-gray-600",
    reply: "맞아요... 저도 유리에 다친 적이 있어요 ㅜㅜ 저 유리 빠르게 교체",
    replyColor: "text-color-gray-black",
    time: "2025.05.27.",
    timeRead: "2025.05.27.",
  },
  chat_message: {
    icon: "/notification/comment.svg",
    iconRead: "/notification/comment_read.svg",
    title: "새로운 메세지가 있습니다.",
    content: "DM_신나는 포도,사나운 보노보",
    tag: "[그룹 채팅]",
    tagRead: "[DM]",
    tagColor: "text-gray-400",
    detail: "안녕하세요? 구매 문의 드립니다.",
    detailColor: "text-gray-600",
    reply: "맞아요... 저도 유리에 다친 적이 있어요 ㅜㅜ 저 유리 빠르게 교체",
    time: "2025.05.27.",
    timeRead: "2025.05.27.",
  },
};

export interface NotificationItemProps {
  type: NotificationType;
  isRead: boolean;
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
}

export interface NotificationListProps {
  items: NotificationItemProps[];
  listSpacing?: number;
  titleFontSize?: string;
  contentFontSize?: string;
  detailFontSize?: string;
  timestampFontSize?: string;
  replyFontSize?: string; // 추가
  titleFontWeight?: string;
  contentFontWeight?: string;
  detailFontWeight?: string;
  timestampFontWeight?: string;
  replyFontWeight?: string;
  verticalSpacing?: number;
  detailVerticalSpacing?: number;
  iconSize?: number;
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
  replyFontSize = "text-sm", // 추가
  titleFontWeight = "font-bold",
  contentFontWeight = "font-medium",
  detailFontWeight = "font-medium",
  timestampFontWeight = "font-medium",
  replyFontWeight = "font-medium",
  verticalSpacing = 8,
  detailVerticalSpacing = 8,
  iconSize = 36,
}: NotificationItemProps) {
  const config = notificationConfig[type];
  const icon = isRead ? config.iconRead : config.icon;
  const time = isRead ? config.timeRead : config.time;
  const tag = type === "chat_message" ? (isRead ? config.tagRead : config.tag) : config.tag;

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
        <div className={`flex-1 flex flex-col justify-center items-start min-w-0${!showIcon ? " pl-0" : " pl-0"}`}>
          <div className={`self-stretch ${titleFontSize} ${titleFontWeight} truncate${isRead ? " text-gray-400" : ""}`}>
            {config.title}
          </div>
          {showContent && (
            <div
              className={`self-stretch ${contentFontSize} ${contentFontWeight} truncate`}
              style={{ marginTop: verticalSpacing }}
            >
              {config.content}
            </div>
          )}
        </div>
        {showTimestamp && (
          <div className={`w-20 text-right text-gray-400 ${timestampFontSize} ${timestampFontWeight}`}>{time}</div>
        )}
      </div>
      {(showTag || showDetail || showReply) && (
        <div
          className="self-stretch flex items-center"
          style={{
            marginTop: verticalSpacing,
            columnGap: 16,
            paddingLeft: showIcon ? (iconSize + 16) : 0, // 아이콘 크기만큼 왼쪽 패딩 title과 content 사이가 gap-4이므로 16을 더한다.
          }}
        >
          <>
            {/* 세로바는 showTag/showDetail 있을 때만 렌더 */}
            {(showTag || showDetail) && (
              <div
                className="w-0 self-stretch outline outline-1 outline-offset-[-0.50px] outline-black"
                style={{
                  minWidth: 0,
                  // 아이콘 크기만큼 세로바도 content와 맞춰서 이동
                  marginLeft: showIcon ? 0 : 0,
                }}
              />
            )}
            <div
              className="flex-1 flex flex-col items-start min-w-0"
              style={{ rowGap: detailVerticalSpacing }}
            >
              {/* tag/detail 영역 */}
              {(showTag || showDetail) && (
                <div className="inline-flex items-start self-stretch min-w-0 gap-x-2">
                  {showTag && (
                    <div className={config.tagColor + " text-xs " + detailFontWeight}>
                      {tag}
                    </div>
                  )}
                  {showDetail && (
                    <div className={`flex-1 ${config.detailColor} text-xs ${detailFontWeight} truncate min-w-0 ${detailFontSize}`}>
                      {config.detail}
                    </div>
                  )}
                </div>
              )}
              {/* reply만 있을 때 위에 불필요한 간격 제거 */}
              {showReply && config.reply && (
                <div className={`self-stretch ${config.replyColor ?? ""} ${replyFontSize} ${replyFontWeight} truncate min-w-0`}>
                  {config.reply}
                </div>
              )}
            </div>
          </>
        </div>
      )}
    </div>
  );
}

export default function NotificationList({
  items,
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
}: NotificationListProps) {
  return (
    <div className="flex flex-col h-[568px] rounded-[5px] border border-purple-500 bg-white overflow-y-auto py-4">
      <ul className="flex-1 flex flex-col">
        {items.map((item, idx) => (
          <li key={idx} style={{ marginBottom: idx < items.length - 1 ? listSpacing : 0 }}>
            <NotificationItem
              {...item}
              titleFontSize={titleFontSize}
              contentFontSize={contentFontSize}
              detailFontSize={detailFontSize}
              timestampFontSize={timestampFontSize}
              replyFontSize={replyFontSize}
              titleFontWeight={titleFontWeight}
              contentFontWeight={contentFontWeight}
              detailFontWeight={detailFontWeight}
              timestampFontWeight={timestampFontWeight}
              replyFontWeight={replyFontWeight}
              verticalSpacing={verticalSpacing}
              detailVerticalSpacing={detailVerticalSpacing}
              iconSize={iconSize}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}