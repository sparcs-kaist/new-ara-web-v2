/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ChatRoomDetail from '@/app/chat/components/ChatRoomDetail';
import { fetchChatRoomList } from '@/lib/api/chat';
import { SocketUrl } from '@/lib/socket/setting';
import { chatSocket } from '@/lib/socket/chat';
import useeKeyboard from '@/app/web_view/hooks/keyboard/useKeyboard';

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

    const [currentRoom, setCurrentRoom] = useState<ChatRoom | undefined>(undefined);

    const { keyboardHeight, isKeyboardOpen } = useeKeyboard();

    useEffect(() => {
        // 1. 마운트 시: body size 고정 (web_view용, viewport가 올라가는 현상 방지)
        const originalStyle = window.getComputedStyle(document.body).overflow;
        const originalPosition = window.getComputedStyle(document.body).position;
        const originalHeight = window.getComputedStyle(document.body).height;
        const originalWidth = window.getComputedStyle(document.body).width;

        document.body.style.position = 'fixed';
        document.body.style.top = '0';
        document.body.style.left = '0';
        document.body.style.width = '100%';
        document.body.style.height = '100%';
        document.body.style.overflow = 'hidden';
        document.body.style.touchAction = 'none'; // 모바일 터치 스크롤 방지

        // Unmout : recover
        return () => {
            document.body.style.position = originalPosition;
            document.body.style.top = '';
            document.body.style.left = '';
            document.body.style.width = originalWidth;
            document.body.style.height = originalHeight;
            document.body.style.overflow = originalStyle;
            document.body.style.touchAction = '';
        };
    }, []);

    useEffect(() => {
        if (roomId) {
            fetchChatRoomList().then((data) => {
                const room = data.results.find((r: ChatRoom) => r.id === roomId);
                setCurrentRoom(room);
            });
        }
    }, [roomId]);

    //for web_view : 최상단 프레임 스크롤 방지
    useEffect(() => {
        // 마운트 될 때 scroll disable
        document.body.style.overflow = 'hidden';
        // 언마운트 될 때 다시 scroll enable
        return () => {
            document.body.style.overflow = 'auto';
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
        <div
            className="bg-white flex flex-col"
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: isKeyboardOpen ? `${keyboardHeight}px` : '0px',
            }}
        >
            <ChatRoomDetail
                roomId={roomId}
                room={currentRoom}
                onMenuClick={() => router.push('/web_view/Chat')}
            />
        </div>
    );
}

