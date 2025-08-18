/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React from 'react';
import Image from 'next/image';

// 참여자 타입 정의
type Member = {
    user: {
        id: number;
        username?: string;
        profile?: {
            picture?: string;
            nickname?: string;
            user?: number;
            is_official?: boolean;
            is_school_admin?: boolean;
        };
    };
    role?: string;
    last_seen_at?: string | null;
};

interface MembersPanelProps {
    isOpen: boolean;
    onClose: () => void;
    members: Member[];
    roomType?: string;
    onLeaveRoom: () => void;
}

// 마지막 접속 시간을 간결하게 포맷하는 함수
const formatLastSeen = (dateString: string | null): string => {
    if (!dateString) return '정보 없음';
    const now = new Date();
    const seenDate = new Date(dateString);
    const diffSeconds = Math.floor((now.getTime() - seenDate.getTime()) / 1000);

    if (diffSeconds < 60) return '방금 전';
    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) return `${diffMinutes}분 전`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}시간 전`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return '어제';
    if (diffDays < 7) return `${diffDays}일 전`;

    return `${seenDate.getFullYear()}.${String(seenDate.getMonth() + 1).padStart(2, '0')}.${String(seenDate.getDate()).padStart(2, '0')}`;
};

export default function MembersPanel({ isOpen, onClose, members, roomType, onLeaveRoom }: MembersPanelProps) {
    return (
        <div className={`absolute inset-0 z-30 ${isOpen ? '' : 'pointer-events-none'}`}>
            <div
                className={`absolute inset-0 bg-black/20 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
                onClick={onClose}
            />
            <aside
                className={`absolute right-0 top-0 h-full w-[320px] bg-white shadow-xl border-l transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-full'} flex flex-col`}
                aria-label="참여자 목록"
            >
                <div className="flex items-center justify-between px-4 py-3 border-b">
                    <div className="font-semibold">멤버 : {members.length}명</div>
                    <button onClick={onClose} className="p-1 rounded hover:bg-gray-100" aria-label="닫기">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                            <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                    </button>
                </div>
                <div className="p-3 overflow-y-auto h-[calc(100%-48px)] flex-grow">
                    {members.length === 0 ? (
                        <div className="text-sm text-gray-500 py-6 text-center">참여자가 없습니다.</div>
                    ) : (
                        <ul className="space-y-4">
                            {members.map((m) => (
                                <li key={m.user.id} className="flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="relative w-9 h-9">
                                            <Image
                                                src={m.user.profile?.picture || '/default-room.png'}
                                                alt={m.user.profile?.nickname || '참여자'}
                                                fill
                                                className="rounded-full object-cover"
                                                sizes="36px"
                                            />
                                        </div>
                                        <div className="flex items-baseline gap-2 min-w-0">
                                            <div className="flex items-center gap-1.5">
                                                <div className="text-[16px] font-medium text-gray-900 truncate">
                                                    {m.user.profile?.nickname || `사용자 ${m.user.id}`}
                                                </div>
                                                {m.role === 'OWNER' && <span className='text-sm text-gray-600'>소유자</span>}
                                            </div>
                                        </div>
                                    </div>
                                    {/* 그룹 채팅방에서 초대 버튼 표시 */}
                                    {roomType === 'GROUP' && (
                                        <button
                                            className="p-1 rounded-full hover:bg-gray-200 text-gray-500 hover:text-gray-800 transition-colors flex-shrink-0"
                                            aria-label={`${m.user.profile?.nickname || '사용자'} 초대하기`}
                                            title="초대하기"
                                            onClick={() => alert('초대 기능은 준비 중입니다.')}
                                        >
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <line x1="12" y1="5" x2="12" y2="19"></line>
                                                <line x1="5" y1="12" x2="19" y2="12"></line>
                                            </svg>
                                        </button>
                                    )}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
                {/* 채팅방 나가기 버튼 영역 */}
                <div className="px-3 py-3 border-t">
                    <button
                        onClick={onLeaveRoom}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        aria-label="채팅방 나가기"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                            <polyline points="16 17 21 12 16 7"></polyline>
                            <line x1="21" y1="12" x2="9" y2="12"></line>
                        </svg>
                        <span>채팅방 나가기</span>
                    </button>
                </div>
            </aside>
        </div>
    );
}
