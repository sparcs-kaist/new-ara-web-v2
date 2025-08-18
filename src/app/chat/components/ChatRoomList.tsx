/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import ChatTypePopover from './ChatTypePopover';
import UserSearchDialog from './UserSearchDialog';
import RoomCreateDialog from './RoomCreateDialog';
import { fetchChatRoomList, createGroupDM } from '@/lib/api/chat';

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
}

export default function ChatRoomList({ selectedRoomId }: ChatRoomListProps) {
    const [rooms, setRooms] = useState<ChatRoom[]>([]);
    const [showTypePopover, setShowTypePopover] = useState(false);
    const [showUserSearch, setShowUserSearch] = useState(false);
    const [showRoomCreate, setShowRoomCreate] = useState(false);
    const router = useRouter();

    useEffect(() => {
        fetchChatRoomList()
            .then((data) => {
                // 정렬: recent_message_at 또는 created_at 중 더 최신인 값 기준 내림차순
                const sortedRooms = [...(data.results || [])].sort((a, b) => {
                    const aTime = new Date(a.recent_message_at || a.created_at || 0).getTime();
                    const bTime = new Date(b.recent_message_at || b.created_at || 0).getTime();
                    return bTime - aTime;
                });
                setRooms(sortedRooms);
            });
    }, []);

    const handleAddChatRoom = async (type: 'DM' | 'GROUP') => {
        if (type === 'DM') {
            setShowUserSearch(true);
        } else {
            setShowRoomCreate(true);
        }
    };

    const handleSelectUser = (user: { id: number; nickname: string }) => {
        alert(`${user.nickname}님과 1:1 채팅방을 생성합니다.`);
        // 실제 DM 생성 로직 연결
    };

    const handleCreateGroupRoom = async ({ title, picture }: { title: string; picture: File | null }) => {
        await createGroupDM(title, picture);
        setShowRoomCreate(false);
        // 채팅방 목록 새로고침
        const data = await fetchChatRoomList();
        const sortedRooms = [...(data.results || [])].sort((a, b) => {
            const aTime = new Date(a.recent_message_at || a.created_at || 0).getTime();
            const bTime = new Date(b.recent_message_at || b.created_at || 0).getTime();
            return bTime - aTime;
        });
        setRooms(sortedRooms);
    };

    return (
        <div className="w-1/4 bg-white rounded-lg shadow-md p-6 flex flex-col relative">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold">💬채팅방</h2>
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
            {/* 검색창 
            <input
                className="mb-4 px-3 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
                type="text"
                placeholder="채팅방 검색"
                disabled
            />
            */}
            {/* 채팅방 목록 */}
            <div className="flex-1 overflow-y-auto divide-y divide-gray-100 no-scrollbar">
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

                    const unreadCount = room.unread_count ?? 0;

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
            </div>

            <UserSearchDialog
                open={showUserSearch}
                onClose={() => setShowUserSearch(false)}
                onSelectUser={handleSelectUser}
            />
            <RoomCreateDialog
                open={showRoomCreate}
                onClose={() => setShowRoomCreate(false)}
                onCreate={handleCreateGroupRoom}
            />
        </div>
    );
}
