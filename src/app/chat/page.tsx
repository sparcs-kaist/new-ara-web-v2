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
    created_at?: string; // 정렬 보조
};

export default function ChatPage() {
    const [rooms, setRooms] = useState<ChatRoom[]>([]);
    const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
    const [currentRoom, setCurrentRoom] = useState<ChatRoom | undefined>(undefined);
    const [isListPanelOpen, setListPanelOpen] = useState(false); // 세부 페이지와 동일한 모바일 패널
    const router = useRouter();

    useEffect(() => {
        fetchChatRoomList().then((data) => {
            // 정렬: recent_message_at 또는 created_at 중 더 최신 값 기준 내림차순
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
                // 첫 번째 방으로 자동 리다이렉트 (기존 동작 유지)
                router.push(`/chat/${firstRoom.id}`);
            }
        });
    }, [router]);

    // 선택된 방이 바뀔 때 현재 방 정보 업데이트
    useEffect(() => {
        if (selectedRoomId) {
            const room = rooms.find((r) => r.id === selectedRoomId);
            setCurrentRoom(room);
        }
    }, [selectedRoomId, rooms]);

    // 세부 페이지와 동일한 컨테이너/레이아웃
    return (
        // 외부 컨테이너: 데스크톱에서는 패딩을 여기에 적용
        <div className="h-[calc(100vh-80px)] bg-white flex lg:p-8">
            {/* 내부 컨테이너: 데스크톱에서는 마진 제거하고 패딩 대신 외부 컨테이너의 패딩 사용 */}
            <div className="relative w-full h-full bg-white lg:rounded-lg lg:shadow-lg flex overflow-hidden">
                {/* 왼쪽: 채팅방 목록 (데스크톱 고정, 모바일 패널) */}
                <ChatRoomList
                    selectedRoomId={selectedRoomId ?? undefined}
                    isPanelOpen={isListPanelOpen}
                    onClose={() => setListPanelOpen(false)}
                />

                {/* 구분선 (데스크톱에서만 보임) */}
                <div className="hidden lg:flex py-4">
                    <div className="w-px bg-gray-200 h-full" />
                </div>

                {/* 오른쪽: 상세 채팅 또는 플레이스홀더 */}
                {selectedRoomId ? (
                    <ChatRoomDetail
                        roomId={selectedRoomId}
                        room={currentRoom}
                        onMenuClick={() => setListPanelOpen(true)}
                    />
                ) : (
                    <div className="flex-1 bg-white flex items-center justify-center">
                        <div className="text-gray-500">채팅방을 선택해주세요.</div>
                    </div>
                )}
            </div>
        </div>
    );
}