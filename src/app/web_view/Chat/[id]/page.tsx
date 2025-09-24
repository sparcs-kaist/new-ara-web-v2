/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useMemo, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ChatRoomDetail from '@/app/chat/components/ChatRoomDetail';
import { fetchChatRoomList } from '@/lib/api/chat';
import { SocketUrl } from '@/lib/socket/setting';
import { chatSocket } from '@/lib/socket/chat';

type ChatRoom = {
    id: number;
    room_title: string;
    room_type: string;
    chat_name_type: string;
    picture: string;
    recent_message_at: string;
    recent_message: number;
    created_at?: string;
};

export default function WebViewChatRoomPage() {
    const params = useParams<{ id: string }>();
    const router = useRouter();
    const roomId = useMemo(() => {
        const id = Array.isArray(params?.id) ? params.id[0] : params?.id;
        return id ? parseInt(id, 10) : null;
    }, [params]);

    const containerRef = useRef<HTMLDivElement>(null);

    const [currentRoom, setCurrentRoom] = useState<ChatRoom | undefined>(undefined);

    useEffect(() => {
        if (roomId) {
            fetchChatRoomList().then((data) => {
                const room = data.results.find((r: ChatRoom) => r.id === roomId);
                setCurrentRoom(room);
            });
        }
    }, [roomId]);

    // for web_view : 동적 화면 조저정 handler
    useEffect(() => {
        const visualViewport = window.visualViewport;
        if (!visualViewport) return; // unsuported
        const handleResize = () => {
            if (containerRef.current) {
                containerRef.current.style.height = `${visualViewport.height}px`;
            }
        }

        handleResize();
        visualViewport.addEventListener('resize', handleResize);
        return () => {
            visualViewport.removeEventListener('resize', handleResize);
        };
    }, []);

    useEffect(() => {
        if (!roomId) return;

        chatSocket.connect(`${SocketUrl}chat/`);

        const joinRoom = () => {
            if (chatSocket.currentRoomId && chatSocket.currentRoomId !== roomId) {
                chatSocket.leave(chatSocket.currentRoomId);
            }
            chatSocket.join(roomId);
            chatSocket.currentRoomId = roomId;
        };

        if (chatSocket.isConnected()) {
            joinRoom();
        } else {
            chatSocket.on('connect', joinRoom);
        }

        return () => {
            chatSocket.off('connect', joinRoom);
            if (chatSocket.currentRoomId === roomId) {
                chatSocket.leave(roomId);
                chatSocket.currentRoomId = null;
            }
        };
    }, [roomId]);

    if (!roomId) {
        return <div>유효하지 않은 채팅방입니다.</div>;
    }

    return (
        <div className=" bg-white flex h-dvh relative overflow-hidden" style={{ height: '100dvh' }} ref={containerRef}>
            <ChatRoomDetail
                roomId={roomId}
                room={currentRoom}
                onMenuClick={() => router.push('/web_view/Chat')}
            />
        </div>
    );
}

