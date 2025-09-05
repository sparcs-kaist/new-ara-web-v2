/* eslint-disable */
'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { fetchChatRoomList } from '@/lib/api/chat';

// ChatRoomList.tsx에서 사용하는 타입 정의를 가져옵니다.
type RecentMessage = {
    id: number;
    message_type: 'TEXT' | 'IMAGE' | 'FILE' | string;
    message_content: string;
};

type ChatRoom = {
    id: number;
    room_title: string;
    picture?: string;
    recent_message_at?: string;
    recent_message?: RecentMessage;
    created_at?: string;
};

const MyChatRooms = () => {
    const [rooms, setRooms] = useState<ChatRoom[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const getRooms = async () => {
            try {
                const data = await fetchChatRoomList();
                const sortedRooms = [...(data.results || [])].sort((a, b) => {
                    const aTime = new Date(a.recent_message_at || a.created_at || 0).getTime();
                    const bTime = new Date(b.recent_message_at || b.created_at || 0).getTime();
                    return bTime - aTime;
                });
                // 메인 페이지에서는 일부만 보여줍니다 (예: 상위 5개)
                setRooms(sortedRooms.slice(0, 5));
            } catch (error) {
                // 비로그인 사용자의 401 에러는 무시합니다.
                if ((error as any).response?.status !== 401) {
                    console.error('Failed to fetch chat rooms:', error);
                }
            } finally {
                setLoading(false);
            }
        };
        getRooms();
    }, []);

    // 비로그인 상태에서는 이 컴포넌트를 렌더링하지 않거나, 다른 내용을 보여줄 수 있습니다.
    // 여기서는 비로그인 시 아무것도 표시하지 않도록 처리합니다.
    if (loading || rooms.length === 0) {
        return null; // 로딩 중이거나, 채팅방이 없거나, 비로그인 상태일 때 아무것도 표시하지 않음
    }

    return (
        <section className="w-full p-4 bg-white rounded-[16px] shadow border border-gray-200 main-page-block-shadow flex flex-col flex-1">
            <Link href="/chat" className="flex items-center space-x-2 mb-[16px]">
                <h2 className="text-[20px] font-bold">💬 나의 채팅방</h2>
                <Image src="/Right_Chevron.svg" width={8.84} height={15} alt="arrow" />
            </Link>
            <div className="flex-grow">
                <ul className="space-y-3">
                    {rooms.map(room => (
                        <li key={room.id}>
                            <Link href={`/chat/${room.id}`} className="flex items-center p-2 -m-2 rounded-lg hover:bg-gray-50 transition">
                                <Image
                                    src={room.picture || '/default-room.png'}
                                    alt={room.room_title}
                                    width={32}
                                    height={32}
                                    className="rounded-full object-cover mr-3"
                                />
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium truncate">{room.room_title}</p>
                                    <p className="text-sm text-gray-500 truncate">
                                        {room.recent_message?.message_content ?? '새로운 채팅방'}
                                    </p>
                                </div>
                            </Link>
                        </li>
                    ))}
                </ul>
            </div>
        </section>
    );
};

export default MyChatRooms;
