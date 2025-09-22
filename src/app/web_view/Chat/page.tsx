/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { fetchChatRoomList } from '@/lib/api/chat';
import ChatRoomList from './components/ChatRoomList';

// ROOM 타입 정의
type ChatRoom = {
    id: number;
    room_title: string;
    room_type: string;
    chat_name_type: string;
    picture: string;
    recent_message_at: string;
    recent_message: number;
    created_at?: string; // 정렬 보조
};

export default function WebViewChatListPage() {
    const [_, setRooms] = useState<ChatRoom[]>([]);
    const router = useRouter();

    useEffect(() => {
        fetchChatRoomList().then((data) => {
            const sortedRooms = [...(data.results || [])].sort((a, b) => {
                const aTime = new Date(a.recent_message_at || a.created_at || 0).getTime();
                const bTime = new Date(b.recent_message_at || b.created_at || 0).getTime();
                return bTime - aTime;
            });
            setRooms(sortedRooms);
        });
    }, []);

    const handleRoomClick = (roomId: number) => {
        router.push(`/web_view/Chat/${roomId}`);
    };

    return (
        <div className="h-screen bg-white flex flex-col">
            <div className="flex-1 overflow-y-auto">
                <ChatRoomList
                    onRoomClick={handleRoomClick}
                />
            </div>
        </div>
    );
}
