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
};

export default function MessageBox({
    isMe,
    profileImg,
    nickname,
    time,
    children,
    theme = 'ara',
}: MessageBoxProps) {
    const themeStyle = messageThemes[theme] || messageThemes['ara'];

    const isCatTheme = (theme: BaseTheme | CatTheme): theme is CatTheme => {
        return (theme as CatTheme).character !== undefined;
    };

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

                {/* 시간 */}
                <div className={`text-[10px] text-gray-400 mt-1 ${isMe ? 'text-right' : 'text-left'}`}>
                    {time}
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
