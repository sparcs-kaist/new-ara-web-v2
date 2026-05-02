/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import ChatTypePopover from './ChatTypePopover';
import UserSearchDialog from './UserSearchDialog';
import RoomCreateDialog from './RoomCreateDialog';
import { createGroupDM, createDM } from '@/lib/api/chat';
import InvitationListDialog from './InvitationListDialog'; // 임포트 추가
import { InfiniteData, UseInfiniteQueryResult, useQueryClient } from '@tanstack/react-query';

// ROOM 타입 정의
type RecentMessage = {
    id: number;
    message_type: 'TEXT' | 'IMAGE' | 'FILE' | string;
    message_content: string;
    created_by: {
        id: number;
        profile?: {
            picture?: string;
            nickname?: string;
            user?: number;
            is_official?: boolean;
            is_school_admin?: boolean;
        };
    };
    created_at: string;
    updated_at?: string;
    expired_at?: string | null;
};

type ChatRoom = {
    id: number;
    room_title: string;
    room_type: string;
    chat_name_type: string;
    picture?: string;
    recent_message_at?: string;
    recent_message?: RecentMessage;   // <- 객체로 변경
    created_at?: string;
};

interface ChatRoomListProps {
    selectedRoomId?: number | null;
    isPanelOpen?: boolean; // 패널 상태 prop 추가
    onClose?: () => void;   // 패널 닫기 함수 prop 추가
    infiniteQuery: UseInfiniteQueryResult<InfiniteData<any, unknown>, Error>
}

export default function ChatRoomList({ selectedRoomId, isPanelOpen, onClose, infiniteQuery }: ChatRoomListProps) {
    const [showTypePopover, setShowTypePopover] = useState(false);
    const [showUserSearch, setShowUserSearch] = useState(false);
    const [showRoomCreate, setShowRoomCreate] = useState(false);
    const [showInvitationDialog, setShowInvitationDialog] = useState(false); // 상태 추가
    const router = useRouter();

    const queryClient = useQueryClient(); // 새로고침을 위한 queryClient
    const observerTarget = useRef<HTMLDivElement>(null);

    // 1. useInfiniteQuery로 무한 스크롤 데이터 및 상태 관리
    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading
    } = infiniteQuery ?? {};

    // 2. React Query의 페이지 데이터를 하나의 배열로 합치고 정렬
    const rooms = React.useMemo<ChatRoom[]>(() => {
        const allRooms = data?.pages.flatMap((page) => page.results || []) || [];
        
        // 중복 제거 및 시간순 정렬
        const uniqueRooms = Array.from(new Map(allRooms.map(room => [room.id, room])).values());
        return uniqueRooms.sort((a, b) => {
            const aTime = new Date(a.recent_message_at || a.created_at || 0).getTime();
            const bTime = new Date(b.recent_message_at || b.created_at || 0).getTime();
            return bTime - aTime;
        });
    }, [data]);

    // 3. IntersectionObserver로 맨 밑에 도달 시 다음 페이지 호출
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
                    fetchNextPage();
                }
            },
            { threshold: 1.0 }
        );

        if (observerTarget.current) {
            observer.observe(observerTarget.current);
        }

        return () => observer.disconnect();
    }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

    const refreshRoomList = () => {
        queryClient.invalidateQueries({ queryKey: ['chatRooms'] });
    };

    const handleAddChatRoom = async (type: 'DM' | 'GROUP') => {
        if (type === 'DM') {
            setShowUserSearch(true);
        } else {
            setShowRoomCreate(true);
        }
    };

    const handleSelectUser = async (user: { id: number; nickname: string }) => {
        try {
            // 1. createDM API를 호출하여 1:1 채팅방 생성을 시도합니다.
            const newRoom = await createDM(user.id);
            // 2. 성공하면 검색 다이얼로그를 닫습니다.
            setShowUserSearch(false);
            // 3. 생성된 채팅방으로 사용자를 이동시킵니다.
            router.push(`/chat/${newRoom.id}`);
        } catch (error: any) {
            // 4. 에러가 발생하면 (ex: 이미 채팅방이 존재) UserSearchDialog가
            //    에러 메시지를 alert로 띄워줄 수 있도록 에러를 다시 던집니다.
            throw error;
        }
    };

    const handleCreateGroupRoom = async ({ title, picture }: { title: string; picture: File | null }) => {
        await createGroupDM(title, picture);
        setShowRoomCreate(false);
        refreshRoomList();
    };

    return (
        // 반응형 컨테이너 - 수정된 부분
        <div className={`
            lg:static lg:w-1/4 lg:pointer-events-auto
            ${!isPanelOpen && 'pointer-events-none'} 
            ${isPanelOpen ? 'absolute inset-0 z-40' : 'absolute inset-0 z-40 lg:relative lg:inset-auto'}
        `}>
            {/* 배경 (모바일 패널 모드에서만 보임) */}
            <div
                className={`
                    absolute lg:hidden inset-0 bg-black bg-opacity-30
                    transition-opacity duration-300 
                    ${isPanelOpen ? 'opacity-100' : 'opacity-0'}
                `}
                onClick={onClose}
            />

            {/* 채팅방 목록 본문 - 수정된 부분 */}
            <aside className={`
                h-full bg-white flex flex-col relative
                w-full max-w-[320px] lg:w-full lg:max-w-none
                transition-transform duration-300
                ${isPanelOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            `}>
                {/* 헤더 */}
                <div className="flex items-center justify-between p-4 lg:p-6 border-b lg:border-none">
                    <h2 className="text-lg font-bold">💬채팅방</h2>
                    <div className="flex items-center gap-2">
                        {/* 초대장 목록 버튼 */}
                        <button
                            className="bg-white rounded-full hover:bg-gray-100 transition p-1"
                            onClick={() => setShowInvitationDialog(true)}
                            aria-label="초대장 목록 보기"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                                />
                            </svg>
                        </button>

                        {/* 채팅방 추가 버튼 */}
                        <div className="relative">
                            <button
                                className="bg-white rounded-full hover:bg-gray-100 transition p-1"
                                onClick={() => setShowTypePopover((v) => !v)}
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-5 w-5"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 4v16m8-8H4"
                                        stroke="black"
                                    />
                                </svg>
                            </button>
                            {showTypePopover && (
                                <ChatTypePopover
                                    onSelect={handleAddChatRoom}
                                    onClose={() => setShowTypePopover(false)}
                                />
                            )}
                        </div>
                    </div>
                </div>

                {/* 채팅방 목록 */}
                <div className="flex-1 overflow-y-auto divide-y divide-gray-100 no-scrollbar p-2 lg:p-0">
                    {rooms.map((room) => {
                        const selected = room.id === selectedRoomId;

                        // 미리보기 텍스트 조합
                        const lastMsg = room.recent_message;
                        const msgType = lastMsg?.message_type;

                        let preview = '';
                        if (msgType === 'IMAGE') {
                            preview = '이미지를 보냈습니다.';
                        } else if (msgType === 'FILE') {
                            preview = '파일을 보냈습니다.';
                        } else {
                            preview = lastMsg?.message_content ?? '';
                        }


                        const previewClamped = preview.length > 80 ? preview.slice(0, 80) + '…' : preview;

                        // 시간 표시 (HH:MM)
                        const timeSrc = room.recent_message_at || room.created_at || '';
                        const timeStr = timeSrc ? timeSrc.slice(11, 16) : '';

                        return (
                            <button
                                key={room.id}
                                className={`w-full flex items-center px-2 py-3 hover:bg-gray-50 transition text-left relative ${selected ? 'bg-gray-50 font-semibold' : 'bg-white'}`}
                                onClick={() => router.push(`/chat/${room.id}`)}
                                style={{ borderRadius: 0 }}
                            >
                                {selected && (
                                    <div
                                        className="absolute left-0 top-0 h-full"
                                        style={{ width: '4px', background: '#E8443A', borderRadius: '2px' }}
                                    />
                                )}
                                <div className="flex-shrink-0 w-9 h-9 relative mr-3 ml-1">
                                    <Image
                                        src={room.picture || '/default-room.png'}
                                        alt={room.room_title}
                                        fill
                                        className="rounded-full object-cover"
                                        sizes="36px"
                                    />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-base truncate mt-[4px] font-medium">{room.room_title}</div>
                                    <div className="text-xs text-gray-500 truncate">
                                        {previewClamped || '새로운 채팅방'}
                                    </div>
                                </div>
                                <div className="ml-2 text-[10px] text-gray-400 flex-shrink-0">
                                    {timeStr}
                                </div>
                            </button>
                        );
                    })}
                    <div ref={observerTarget} className="h-0 w-full" />
                    {(isLoading || isFetchingNextPage) && (
                        <div className="text-gray-400 text-sm text-center py-4">
                            더 불러오는 중...
                        </div>
                    )}
                </div>

                <UserSearchDialog
                    open={showUserSearch}
                    onClose={() => setShowUserSearch(false)}
                    onSelectUser={handleSelectUser}
                    title="새로운 1:1 채팅"
                    actionText="채팅"
                />
                <RoomCreateDialog
                    open={showRoomCreate}
                    onClose={() => setShowRoomCreate(false)}
                    onCreate={handleCreateGroupRoom}
                />
                {/* 새로 추가된 초대장 다이얼로그 */}
                <InvitationListDialog
                    open={showInvitationDialog}
                    onClose={() => setShowInvitationDialog(false)}
                    onActionComplete={refreshRoomList}
                />
            </aside>
        </div>
    );
}
