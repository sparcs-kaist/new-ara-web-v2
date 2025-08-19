import React from 'react';
import Image from 'next/image';

interface ImageMessageProps {
    url: string;
    alt?: string;
    isMe: boolean;
    time?: string;
    readCount?: number;
}

const ImageMessage: React.FC<ImageMessageProps> = ({
    url,
    alt,
    isMe,
    time,
    readCount
}) => {
    return (
        <div className={`flex items-end gap-1 max-w-[280px]`}>
            {/* 내 메시지: 시간이 왼쪽 */}
            {isMe && time && (
                <div className="flex flex-col text-xs text-gray-500">
                    {readCount !== undefined && (
                        <span className="text-left text-[#e15858]">{readCount}</span>
                    )}
                    <span className="text-left">{time}</span>
                </div>
            )}

            <div className="rounded-lg overflow-hidden">
                <Image
                    src={url}
                    alt={alt || '이미지'}
                    width={280}
                    height={280}
                    className="object-contain max-h-72 w-auto"
                />
            </div>

            {/* 상대방 메시지: 시간이 오른쪽 */}
            {!isMe && time && (
                <div className="flex flex-col text-xs text-gray-500">
                    {readCount !== undefined && (
                        <span className="text-right text-[#e15858]">{readCount}</span>
                    )}
                    <span className="text-right">{time}</span>
                </div>
            )}
        </div>
    );
};

export default ImageMessage;
