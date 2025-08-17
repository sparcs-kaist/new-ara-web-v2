import React from 'react';
import Image from 'next/image';
import { messageThemes, MessageTheme, BaseTheme, CatTheme } from './MessageThemes';

type MessageBoxProps = {
    isMe: boolean;
    profileImg?: string | null;         // optional
    nickname?: string;
    time?: string;                      // optional
    children: React.ReactNode;
    theme?: MessageTheme;
    readStatus?: 'read' | 'delivered' | 'sending';
    readCount?: number;
    isGrouped?: boolean;                // 추가
};

export default function MessageBox({
    isMe,
    profileImg,
    nickname,
    time,
    children,
    theme = 'ara',
    readStatus,
    readCount,
    isGrouped = false,
}: MessageBoxProps) {
    const hasTheme = (t: string): t is MessageTheme => t in messageThemes;
    const themeKey: MessageTheme = hasTheme(theme) ? theme : 'ara';
    const themeStyle = messageThemes[themeKey] as BaseTheme;

    const bubbleBase = `${themeStyle.bubble.radius} ${themeStyle.bubble.padding} ${themeStyle.bubble.shadow ?? ''}`;
    const bubbleColor = isMe ? themeStyle.bubble.me : themeStyle.bubble.other;

    return (
        <div className={`flex ${isMe ? 'flex-row-reverse' : 'flex-row'} items-end max-w-[80%]`}>
            {/* 프로필: 그룹 중간이면 숨김, 이미지 없으면 렌더 생략 */}
            {!isMe && !isGrouped && (
                <div className="flex-shrink-0 mr-2 w-9 h-9">
                    {profileImg ? (
                        <Image
                            src={profileImg}
                            alt={nickname || ''}
                            width={36}
                            height={36}
                            className="rounded-full object-cover"
                        />
                    ) : null}
                </div>
            )}

            <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                {!isMe && !isGrouped && nickname ? (
                    <div className="text-xs text-gray-600 mb-1">{nickname}</div>
                ) : null}

                <div className="flex items-end gap-1">
                    {/* 말풍선 적용 */}
                    <div className={`${bubbleBase} ${bubbleColor} whitespace-pre-wrap break-words max-w-[28rem]`}>
                        {children}
                    </div>

                    {/* 그룹의 마지막 메시지에만 시간/읽음 표시 */}
                    {(time || readStatus !== undefined || readCount !== undefined) && (
                        <div className="flex flex-col text-xs text-gray-500 min-w-[50px]">
                            {readCount !== undefined && (
                                <span className={`${isMe ? 'text-right' : 'text-left'}`}>{readCount}명 읽음</span>
                            )}
                            {time && <span className={`${isMe ? 'text-right' : 'text-left'}`}>{time}</span>}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
