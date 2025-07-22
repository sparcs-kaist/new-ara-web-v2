import Image from "next/image";

type NotificationType = "article_commented" | "comment_commented" | "chat_message";

interface NotificationConfig {
  icon: string;
  iconRead: string;
  title: string;
  content: string;
  tag: string;
  tagColor: string;
  subContent: string;
  subContentColor: string;
  time: string;
  timeRead: string;
  // 아래 3개는 일부 타입에서만 사용하므로 optional로 지정
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
    subContent: "", // article_commented는 subContent 없음
    subContentColor: "text-gray-600",
    reply: "희망관 샤워실 유리 부스 교체 부탁드립니다.", // 본문 내용은 reply로
    replyColor: "text-color-gray-black",
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
    subContent: "희망관 샤워실 유리 부스 교체 부탁드립니다.", // comment_commented는 subContent 사용
    subContentColor: "text-gray-600",
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
    subContent: "", // chat_message도 subContent 없음
    subContentColor: "text-color-gray-black",
    reply: "안녕하세요? 구매 문의 드립니다.",
    replyColor: "text-gray-600",
    time: "2025.05.27.",
    timeRead: "2025.05.27.",
  },
};

interface NotificationItemProps {
  type: NotificationType;
  isRead: boolean;
}

const notificationData: NotificationItemProps[] = [
  { type: "article_commented", isRead: false },
  { type: "comment_commented", isRead: false },
  { type: "article_commented", isRead: true },
  { type: "comment_commented", isRead: true },
  { type: "chat_message", isRead: false },
  { type: "chat_message", isRead: true },
];

function NotificationItem({ type, isRead }: NotificationItemProps) {
  const config = notificationConfig[type];
  const icon = isRead ? config.iconRead : config.icon;
  const time = isRead ? config.timeRead : config.time;

  return (
    <div className="w-[551px] py-3 mx-auto flex flex-col justify-center items-center gap-3">
      <div className="self-stretch flex justify-start items-center gap-3">
        <div className={`w-9 h-9 rounded-2xl inline-flex flex-col justify-center items-center gap-2.5 overflow-hidden ${
          type === "article_commented" || type === "comment_commented"
            ? isRead
              ? "bg-color-neutral-light1"
              : "bg-color-brand-default"
            : "bg-color-neutral-light1"
        }`}>
          <Image
            src={icon}
            alt="알림 아이콘"
            width={36}
            height={36}
            className="object-contain"
          />
        </div>
        <div className="flex-1 flex flex-col justify-center items-start gap-2 min-w-0">
          <div className={`self-stretch ${type === "chat_message" ? "text-color-neutral-light1" : "text-color-gray-black"} text-base font-bold truncate`}>
            {config.title}
          </div>
          <div className={`self-stretch ${type === "chat_message" ? "text-color-neutral-default" : "text-color-gray-black"} text-base font-medium truncate`}>
            {config.content}
          </div>
        </div>
        <div className="w-20 text-right text-gray-400 text-sm font-medium">{time}</div>
      </div>
      <div className="self-stretch pl-12 flex items-center gap-2">
        <div className="w-0 self-stretch outline outline-1 outline-offset-[-0.50px] outline-black" />
        <div className="flex-1 flex flex-col items-start gap-1 min-w-0">
          <div className="inline-flex items-start gap-1 self-stretch min-w-0">
            <div className={config.tagColor + " text-xs font-medium"}>
              {type === "chat_message" ? (isRead ? config.tagRead : config.tag) : config.tag}
            </div>
            {(type === "article_commented" || type === "chat_message") && (
              <div className={`flex-1 ${config.subContentColor} text-xs font-medium truncate min-w-0`}>
                {config.subContent}
              </div>
            )}
            {type === "comment_commented" && (
              <div className={`flex-1 ${config.subContentColor} text-xs font-medium truncate min-w-0`}>
                {config.subContent}
              </div>
            )}
          </div>
          <div className={`self-stretch ${config.replyColor} text-sm font-medium truncate min-w-0`}>
            {config.reply}
          </div>
          {type === "chat_message" && (
            <div className={`self-stretch ${config.subContentColor} text-sm font-medium truncate min-w-0`}>
              {config.subContent}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function NotificationList() {
  return (
    <div className="w-[591px] h-[568px] rounded-[5px] border border-purple-500 bg-white overflow-y-auto">
      {notificationData.map((item, idx) => (
        <NotificationItem key={idx} {...item} />
      ))}
    </div>
  );
}