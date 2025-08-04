import React from 'react';
import Image from 'next/image';
import { messageThemes, MessageTheme, BaseTheme, CatTheme } from './MessageThemes';

type MessageBoxProps = {
    isMe: boolean;
    profileImg: string;
    nickname?: string;
    time: string;
    children: React.ReactNode;
    theme?: MessageTheme;
    readStatus?: 'read' | 'delivered' | 'sending';
    readCount?: number; // 추가
};

export default function MessageBox({
    isMe,
    profileImg,
    nickname,
    time,
    children,
    theme = 'ara',
    //readStatus = 'read',
    readCount, // 추가
}: MessageBoxProps) {
    const themeStyle = messageThemes[theme] || messageThemes['ara'];
    const isCatTheme = (theme: BaseTheme | CatTheme): theme is CatTheme => {
        return (theme as CatTheme).character !== undefined;
    };

    // 읽음 상태 텍스트 및 아이콘
    /*const getReadStatus = () => {
        switch (readStatus) {
            case 'read':
                return (
                    <span style={{ color: themeStyle.readStatusColor }}>
                        <svg width="14" height="14" viewBox="0 0 20 20" fill="none" className="inline mr-1">
                            <path d="M6 10l3 3 5-5" stroke="currentColor" strokeWidth="2" fill="none" />
                        </svg>
                        읽음
                    </span>
                );
            case 'delivered':
                return (
                    <span style={{ color: themeStyle.readStatusColor }}>
                        <svg width="14" height="14" viewBox="0 0 20 20" fill="none" className="inline mr-1">
                            <path d="M6 10l3 3 5-5" stroke="currentColor" strokeWidth="2" fill="none" />
                        </svg>
                        전송됨
                    </span>
                );
            case 'sending':
                return (
                    <span style={{ color: themeStyle.readStatusColor }}>
                        <svg width="14" height="14" viewBox="0 0 20 20" fill="none" className="inline mr-1 animate-spin">
                            <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="2" fill="none" />
                        </svg>
                        전송중...
                    </span>
                );
            default:
                return null;
        }
    };
    */

    return (
        <div className={`flex items-end ${isMe ? 'justify-end' : 'justify-start'} mb-3`}>
            {/* 상대방 프로필 */}
            {!isMe && (
                <Image
                    src={profileImg}
                    alt={nickname || '상대방'}
                    width={32}
                    height={32}
                    className="rounded-full object-cover mr-2"
                />
            )}

            <div className="max-w-xs">
                {/* 닉네임 */}
                {!isMe && nickname && (
                    <div className="text-xs text-gray-500 mb-1 ml-1">{nickname}</div>
                )}

                <div className={`relative px-4 py-2 rounded-2xl break-words ${isMe ? themeStyle.me : themeStyle.other}`}>
                    {children}

                    {/* 고양이 캐릭터 - 내 메시지 */}
                    {theme === 'cat' && isMe && isCatTheme(themeStyle) && (
                        <Image
                            src={themeStyle.character}
                            alt="cat"
                            width={40}
                            height={40}
                            className="absolute -top-3 -right-3"
                        />
                    )}

                    {/* 고양이 캐릭터 - 상대 메시지 */}
                    {theme === 'cat' && !isMe && isCatTheme(themeStyle) && (
                        <Image
                            src={themeStyle.characterOther}
                            alt="cat"
                            width={40}
                            height={40}
                            className="absolute -top-3 -left-3"
                        />
                    )}
                </div>

                {/* 시간 및 읽음 숫자만 오른쪽에 표시 (카카오톡 스타일) */}
                <div className={`flex items-center justify-end text-[10px] mt-1`}>
                    <span className="text-gray-400">{time}</span>
                    {isMe && typeof readCount === 'number' && (
                        <span className="ml-2 px-2 py-0.5 rounded-full bg-gray-200 text-gray-600 text-[10px] font-semibold min-w-[20px] text-center">
                            {readCount}
                        </span>
                    )}
                </div>
            </div>

            {/* 내 프로필 */}
            {isMe && (
                <Image
                    src={profileImg}
                    alt={nickname || '나'}
                    width={32}
                    height={32}
                    className="rounded-full object-cover ml-2"
                />
            )}
        </div>
    );
}
