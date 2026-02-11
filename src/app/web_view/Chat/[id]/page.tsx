/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ChatRoomDetail from '@/app/chat/components/ChatRoomDetail';
import { fetchChatRoomList } from '@/lib/api/chat';
import { SocketUrl } from '@/lib/socket/setting';
import { chatSocket } from '@/lib/socket/chat';
import useeKeyboard from '@/app/web_view/hooks/keyboard/useKeyboard';
import { usePlatform } from '@/app/web_view/hooks/usePlatform';

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

    const [appHeight, setAppHeight] = useState('100%');

    useEffect(() => {
        const originalHtmlStyle = window.getComputedStyle(document.documentElement).overflow;
        const originalBodyStyle = window.getComputedStyle(document.body).overflow;
        const originalBodyPosition = document.body.style.position;
        const originalBodyWidth = document.body.style.width;
        const originalBodyHeight = document.body.style.height;

        document.documentElement.style.overflow = 'hidden';

        document.body.style.overflow = 'hidden';
        document.body.style.position = 'fixed';
        document.body.style.width = '100%';
        document.body.style.height = '100%';
        document.body.style.touchAction = 'none';

        return () => {
            document.documentElement.style.overflow = originalHtmlStyle;
            document.body.style.overflow = originalBodyStyle;
            document.body.style.position = originalBodyPosition;
            document.body.style.width = originalBodyWidth;
            document.body.style.height = originalBodyHeight;
            document.body.style.touchAction = '';
        };
    }, []);

    useEffect(() => {
        const handleResize = () => {
            if (window.visualViewport) {
                const currentHeight = window.visualViewport.height;
                setAppHeight(`${currentHeight}px`);

                window.scrollTo(0, 0);
            } else {
                setAppHeight(`${window.innerHeight}px`);
            }
        };

        if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', handleResize);
            window.visualViewport.addEventListener('scroll', handleResize); // 스크롤 시도 차단
            handleResize(); // 초기값 세팅
        } else {
            window.addEventListener('resize', handleResize);
        }

        return () => {
            if (window.visualViewport) {
                window.visualViewport.removeEventListener('resize', handleResize);
                window.visualViewport.removeEventListener('scroll', handleResize);
            } else {
                window.removeEventListener('resize', handleResize);
            }
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
            className="bg-white flex flex-col w-full"
            style={{
                height: appHeight,
                overflow: 'hidden', // 내부 스크롤만 허용
                position: 'relative', // 자식 요소 위치 기준점
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

