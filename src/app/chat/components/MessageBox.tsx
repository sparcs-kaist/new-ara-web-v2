/* eslint-disable */

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

    const InfoCol = (time || readStatus !== undefined || readCount !== undefined) ? (
        <div className="flex flex-col text-xs text-gray-500 min-w-[50px]">
            {readCount !== undefined && (
                <span className={`${isMe ? 'text-right' : 'text-left'} text-[#e15858]`}>{readCount}</span>
            )}
            {time && <span className={`${isMe ? 'text-right' : 'text-left'}`}>{time}</span>}
        </div>
    ) : null;

    return (
        <div className={`flex ${isMe ? 'flex-row-reverse' : 'flex-row'} items-end`}>
            {/* 프로필/여백: 상대 메시지일 때는 항상 너비 유지, 그룹 중간이면 높이만 0 */}
            {!isMe && (
                <div className={`flex-shrink-0 w-0 ${isGrouped ? 'h-0' : 'h-9'}`}>
                    {!isGrouped && (
                        profileImg ? (
                            <Image
                                src={profileImg}
                                alt={nickname || ''}
                                width={36}
                                height={36}
                                className="rounded-full object-cover"
                            />
                        ) : (
                            <div className="w-9 h-9" aria-hidden />
                        )
                    )}
                </div>
            )}

            <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                {!isMe && !isGrouped && nickname ? (
                    <div className="text-xs text-gray-600 mb-1">{nickname}</div>
                ) : null}

                {/* 말풍선 + 시간/읽음: 내 메시지는 시간 칼럼을 왼쪽에 배치 */}
                <div className="flex items-end gap-1">
                    {isMe ? InfoCol : null}
                    <div className={`${bubbleBase} ${bubbleColor} whitespace-pre-wrap break-words max-w-[28rem]`}>
                        {children}
                    </div>
                    {!isMe ? InfoCol : null}
                </div>
            </div>
        </div>
    );
}
