/* eslint-disable */
'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import LeaveContextMenu from '@/app/chat/components/LeaveContextMenu';

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
    myId?: number;
    onLeaveRoom: () => void;
    onBlockUser: () => void;
    onBlockAndLeave: () => void;
    onDeleteRoom: () => void;
    onInviteClick: () => void; // 추가
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

export default function MembersPanel({
    isOpen,
    onClose,
    members,
    roomType,
    myId,
    onLeaveRoom,
    onBlockUser,
    onBlockAndLeave,
    onDeleteRoom,
    onInviteClick, // 추가
}: MembersPanelProps) {
    const [menu, setMenu] = useState<{ visible: boolean; x: number; y: number }>({ visible: false, x: 0, y: 0 });

    const myRole = members.find(m => m.user.id === myId)?.role;
    const isOwner = myRole === 'OWNER'; // 백엔드에서 'OWNER'로 오는지 확인 필요

    const handleFooterButtonClick = (e: React.MouseEvent) => {
        if (roomType === 'DM') {
            onBlockUser();
            return;
        }

        if (roomType === 'GROUP_DM') {
            const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
            setMenu({
                visible: true,
                x: rect.left,
                y: rect.top - 8, // 8px offset
            });
        }
    };

    const closeMenu = () => setMenu({ ...menu, visible: false });

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
                    <div className="flex items-center gap-2">
                        {/* 초대 버튼: 그룹 채팅방의 방장에게만 보임 */}
                        {roomType === 'GROUP_DM' && isOwner && (
                            <button
                                onClick={onInviteClick}
                                className="p-1.5 rounded-full hover:bg-gray-100"
                                aria-label="멤버 초대하기"
                                title="멤버 초대하기"
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                                    <circle cx="9" cy="7" r="4"></circle>
                                    <line x1="19" y1="8" x2="19" y2="14"></line>
                                    <line x1="22" y1="11" x2="16" y2="11"></line>
                                </svg>
                            </button>
                        )}
                        <button onClick={onClose} className="p-1 rounded hover:bg-gray-100" aria-label="닫기">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                                <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                            </svg>
                        </button>
                    </div>
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
                        onClick={handleFooterButtonClick}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        aria-label={roomType === 'DM' ? '사용자 차단하기' : '채팅방 나가기 옵션'}
                    >
                        <span>{roomType === 'DM' ? '사용자 차단하기' : '채팅방 나가기'}</span>
                    </button>
                </div>
            </aside>
            {menu.visible && roomType === 'GROUP_DM' && (
                <LeaveContextMenu
                    x={menu.x}
                    y={menu.y}
                    onClose={closeMenu}
                    isOwner={isOwner}
                    onLeave={onLeaveRoom}
                    onBlockAndLeave={onBlockAndLeave}
                    onDelete={onDeleteRoom}
                />
            )}
        </div>
    );
}
