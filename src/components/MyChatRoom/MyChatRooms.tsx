'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import Image from 'next/image';
import Link from 'next/link';
import { fetchChatRoomList } from '@/lib/api/chat';
import { displayRoomPicture, displayRoomTitle, roomPreview, type ChatPartner } from '@/lib/chat/roomName';

// ChatRoomList.tsx에서 사용하는 타입 정의를 가져옵니다.
type RecentMessage = {
    id: number;
    message_type: 'TEXT' | 'IMAGE' | 'FILE' | string;
    message_content: string;
};

type ChatRoom = {
    id: number;
    room_type: string;
    room_title: string;
    picture?: string;
    partner?: ChatPartner | null;
    recent_message_at?: string;
    recent_message?: RecentMessage;
    created_at?: string;
};

const MyChatRooms = () => {
    const { data: rooms = [], isLoading: loading } = useQuery<ChatRoom[]>({
        queryKey: ['home', 'chatRooms'],
        queryFn: async () => {
            const data = await fetchChatRoomList();
            const sortedRooms = [...(data.results || [])].sort((a: ChatRoom, b: ChatRoom) => {
                const aTime = new Date(a.recent_message_at || a.created_at || 0).getTime();
                const bTime = new Date(b.recent_message_at || b.created_at || 0).getTime();
                return bTime - aTime;
            });
            // 메인 페이지에서는 일부만 보여줍니다 (예: 상위 5개)
            return sortedRooms.slice(0, 5);
        },
        // 목록은 소켓으로 갱신되지 않으므로 짧게 둔다.
        staleTime: 10_000,
        // 비로그인(401)이면 재시도하지 않고 빈 목록으로 둔다.
        retry: false,
    });

    // 비로그인 상태에서는 이 컴포넌트를 렌더링하지 않거나, 다른 내용을 보여줄 수 있습니다.
    // 여기서는 비로그인 시 아무것도 표시하지 않도록 처리합니다.
    if (loading) {
        return null;
    }

    return (
        <section className="w-full p-4 bg-white rounded-[16px] shadow border border-gray-200 main-page-block-shadow flex flex-col flex-1">
            <Link href="/chat" className="flex items-center space-x-2 mb-[16px]">
                <h2 className="text-[20px] font-bold">💬 나의 채팅방</h2>
                <Image src="/Right_Chevron.svg" width={8.84} height={15} alt="arrow" />
            </Link>
            <div className="flex-grow">
                <ul className="space-y-3">
                    {rooms.map(room => {
                        const title = displayRoomTitle(room, room.partner);
                        return (
                            <li key={room.id}>
                                <Link href={`/chat/${room.id}`} className="flex items-center p-2 -m-2 rounded-lg hover:bg-gray-50 transition">
                                    <div className="relative mr-3 h-8 w-8 shrink-0">
                                        <Image
                                            src={displayRoomPicture(room, room.partner)}
                                            alt={title}
                                            fill
                                            sizes="32px"
                                            className="rounded-full object-cover"
                                        />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium truncate">{title}</p>
                                        <p className="text-sm text-gray-500 truncate">
                                            {roomPreview(room.recent_message) || '새로운 채팅방'}
                                        </p>
                                    </div>
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </div>
        </section>
    );
};

export default MyChatRooms;
