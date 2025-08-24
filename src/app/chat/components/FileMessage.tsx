import React from 'react';

interface FileMessageProps {
    url: string;
    name: string;
    isMe: boolean;
    time?: string;
    readCount?: number;
}

const FileMessage: React.FC<FileMessageProps> = ({
    url,
    name,
    isMe,
    time,
    readCount
}) => {
    return (
        <div className={`flex items-end gap-1`}>
            {/* 내 메시지: 시간이 왼쪽 */}
            {isMe && time && (
                <div className="flex flex-col text-xs text-gray-500">
                    {readCount !== undefined && (
                        <span className="text-left text-[#e15858]">{readCount}</span>
                    )}
                    <span className="text-left">{time}</span>
                </div>
            )}

            <a
                href={url}
                download
                target="_blank"
                rel="noreferrer"
                className={`flex items-center gap-2 p-3 bg-gray-100 border border-gray-200 rounded-lg hover:bg-gray-200 transition-colors`}
            >
                <div className="p-2 rounded-full">
                    <svg viewBox="0 0 24 24" className="w-5 h-5 text-black" fill="none" stroke="currentColor">
                        <path
                            d="M21 12.5l-8.5 8.5a6 6 0 01-8.5-8.5L12 4.5a4 4 0 115.7 5.6l-9 9a2 2 0 11-2.8-2.8l8-8"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                </div>
                <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-800 truncate max-w-[200px]">{name}</span>
                    <span className="text-xs text-gray-500">파일 다운로드</span>
                </div>
            </a>

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

export default FileMessage;
