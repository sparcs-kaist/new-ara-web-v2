/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ChatRoomList from './components/ChatRoomList';
import ChatRoomDetail from './components/ChatRoomDetail';
import { fetchChatRoomList } from '@/lib/api/chat';

// ROOM 타입 정의
type ChatRoom = {
    id: number;
    room_title: string;
    room_type: string;
    chat_name_type: string;
    picture: string;
    recent_message_at: string;
    recent_message: number;
};

export default function ChatPage() {
    const [rooms, setRooms] = useState<ChatRoom[]>([]);
    const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
    const [currentRoom, setCurrentRoom] = useState<ChatRoom | undefined>(undefined);
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
                if (sortedRooms.length > 0) {
                    const firstRoom = sortedRooms[0];
                    setSelectedRoomId(firstRoom.id);
                    setCurrentRoom(firstRoom);
                    // 첫 번째 방으로 자동 리다이렉트
                    router.push(`/chat/${firstRoom.id}`);
                }
            });
    }, [router]);

    // 선택된 방이 바뀔 때 현재 방 정보 업데이트
    useEffect(() => {
        if (selectedRoomId) {
            const room = rooms.find(r => r.id === selectedRoomId);
            setCurrentRoom(room);
        }
    }, [selectedRoomId, rooms]);

    return (
        <div className="h-[calc(100vh-80px)] bg-gray-100 flex px-20 py-8">
            {/* 왼쪽 박스 (채팅방 목록) */}
            <ChatRoomList selectedRoomId={selectedRoomId} />

            {/* 오른쪽 박스 (상세 채팅) */}
            {selectedRoomId ? (
                <ChatRoomDetail roomId={selectedRoomId} room={currentRoom} />
            ) : (
                <div className="w-3/4 bg-white rounded-lg shadow-md p-6 ml-4 flex flex-col items-center justify-center">
                    <div className="text-gray-500">채팅방을 선택해주세요.</div>
                </div>
            )}
        </div>
    );
}