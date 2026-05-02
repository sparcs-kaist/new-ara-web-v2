'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, usePathname } from 'next/navigation';
import ChatRoomList from '../components/ChatRoomList';
import ChatRoomDetail from '../components/ChatRoomDetail';
import { fetchChatRoomList, readChatRoom } from '@/lib/api/chat';
import { SocketUrl } from '@/lib/socket/setting';
import { chatSocket } from '@/lib/socket/chat';
import { useInfiniteQuery } from '@tanstack/react-query';

type ChatRoom = {
    id: number;
    room_title: string;
    room_type: string;
    chat_name_type: string;
    picture: string;
    recent_message_at: string;   
    recent_message: number;
};

export default function ChatRoomPage() {
    const params = useParams<{ room_id: string }>();
    const roomId = useMemo(() => {
        const id = Array.isArray(params?.room_id) ? params.room_id[0] : params?.room_id;
        return id ? parseInt(id, 10) : null;
    }, [params]);

    const pathname = usePathname(); // 소켓 처리를 위한 pathname 훅 사용

    const [isListPanelOpen, setListPanelOpen] = useState(false); // 채팅방 목록 패널 상태

    const infiniteQuery = useInfiniteQuery({
        queryKey: ['chatRooms'],
        queryFn: ({ pageParam }) => fetchChatRoomList(pageParam, 15),
        initialPageParam: 1,
        getNextPageParam: (lastPage, allPages) => lastPage.results?.length === 15 ? allPages.length + 1 : undefined,
    });

    const rooms = useMemo<ChatRoom[]>(() => {
        const allRooms = infiniteQuery.data?.pages.flatMap((page) => page.results || []) || [];
        
        // 중복 제거 및 시간순 정렬
        const uniqueRooms = Array.from(new Map(allRooms.map(room => [room.id, room])).values());
        return uniqueRooms.sort((a, b) => {
            const aTime = new Date(a.recent_message_at || a.created_at || 0).getTime();
            const bTime = new Date(b.recent_message_at || b.created_at || 0).getTime();
            return bTime - aTime;
        });
    }, [infiniteQuery]);

    // roomId 값이 변경될 때가 아니라 실제 pathname이 변경될 때만 채팅방 변경 처리
    useEffect(() => {
        if (!roomId) return;

        // 소켓 연결하기
        chatSocket.connect(`${SocketUrl}chat/`);
        readChatRoom(roomId); // 채팅방 읽음 처리

        // 연결 상태에서만 join 처리
        const joinRoom = () => {
            // 이전 채팅방이 있고 다르다면 떠나기
            if (chatSocket.currentRoomId && chatSocket.currentRoomId !== roomId) {
                console.log(`leave room ${chatSocket.currentRoomId}`);
                chatSocket.leave(chatSocket.currentRoomId);
            }


            // 새 채팅방 입장 (백엔드 스펙: 'connect_room' 대신 'join' 사용)
            console.log(`join room ${roomId}`);
            chatSocket.join(roomId);
            chatSocket.currentRoomId = roomId;

            // 디버깅: 소켓 연결 확인
            console.log(`소켓 연결 상태: ${chatSocket.isConnected()}, 현재 방: ${chatSocket.currentRoomId}`);
        };    // 이미 연결된 상태면 바로 처리, 아니면 연결 이벤트 기다림
        if (chatSocket.isConnected()) {
            console.log('소켓 이미 연결됨, 바로 방 입장');
            joinRoom();
        } else {
            console.log('소켓 연결 대기 중');
        }

        const handleConnect = () => {
            console.log('소켓 연결 이벤트 발생, 방 입장 시도');
            joinRoom();
        };
        chatSocket.on('connect', handleConnect);

        return () => {
            chatSocket.off('connect', handleConnect);
            // 페이지 전환 시 소켓 연결 유지하고 방만 나가기
            if (chatSocket.currentRoomId === roomId) {
                console.log(`페이지 언마운트: ${roomId} 방에서 나갑니다.`);
                // 백엔드 스펙: 'disconnect_room' 대신 'leave' 사용
                chatSocket.leave(roomId);
                chatSocket.currentRoomId = null;
            }
            // 소켓 연결은 유지 (disconnect 제거)
        };
    }, [pathname, roomId]); // pathname이 변경될 때만 실행되도록 의존성 추가

    console.log(infiniteQuery)
    if (!infiniteQuery) return null;

    if (!roomId) {
        return (
            <div className="flex items-center justify-center min-h-[300px] text-gray-500">
                잘못된 채팅방 ID입니다.
            </div>
        );
    }

    return (
        <div className="h-[calc(100vh-80px)] bg-white flex lg:p-8">
            <div className="relative w-full h-full bg-white lg:rounded-lg lg:shadow-lg flex overflow-hidden">

                <ChatRoomList
                    selectedRoomId={roomId}
                    isPanelOpen={isListPanelOpen}
                    onClose={() => setListPanelOpen(false)}
                    infiniteQuery={infiniteQuery}
                />

                <div className="hidden lg:flex py-4">
                    <div className="w-px bg-gray-200 h-full"></div>
                </div>

                <ChatRoomDetail
                    roomId={roomId}
                    onMenuClick={() => setListPanelOpen(true)}
                    room={rooms.find(r => r.id === roomId)}
                />
            </div>
        </div>
    );
}