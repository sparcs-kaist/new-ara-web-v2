/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import MessageBox from './MessageBox';
import { fetchChatMessages, sendMessage } from '@/lib/api/chat';
import { fetchMe } from '@/lib/api/user';
import { chatSocket } from '@/lib/socket/chat';

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

// 기본 프로필 이미지
const DEFAULT_ROOM_IMAGE = '/default-room.png';

interface ChatRoomDetailProps {
    roomId: number;
    room?: ChatRoom;
}

export default function ChatRoomDetail({ roomId, room }: ChatRoomDetailProps) {
    const [messages, setMessages] = useState<any[]>([]);
    const [input, setInput] = useState('');
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [myId, setMyId] = useState<number | null>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);
    const messageContainerRef = useRef<HTMLDivElement>(null);

    // 내 ID 가져오기
    useEffect(() => {
        fetchMe()
            .then((data) => {
                setMyId(data.user);
            });
    }, []);

    // 메시지 목록 불러오기
    useEffect(() => {
        if (!roomId) return;
        setLoadingMessages(true);
        fetchChatMessages(roomId)
            .then(data => setMessages(data.results || []))
            .finally(() => setLoadingMessages(false));
    }, [roomId]);

    // 소켓 이벤트 리스너 추가
    useEffect(() => {
        // 메시지 업데이트 수신
        const handleRoomUpdate = (data: any) => {
            if (data.payload?.resource === 'messages' &&
                data.payload?.room_id === roomId &&
                data.payload?.change === 'created') {
                // 메시지 목록 갱신
                fetchChatMessages(roomId)
                    .then(data => setMessages(data.results || []));
            }
        };

        // 이벤트 리스너 등록
        chatSocket.on('room_update', handleRoomUpdate);

        return () => {
            // 컴포넌트 언마운트 시 리스너 제거
            chatSocket.off('room_update', handleRoomUpdate);
        };
    }, [roomId]);

    // 메시지 전송
    const handleSend = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!input.trim() || !roomId) return;
        try {
            await sendMessage(roomId, input);
            setInput('');

            // 소켓 업데이트 알림 전송
            chatSocket.send({
                type: 'update',
                payload: {
                    resource: 'messages',
                    room_id: roomId,
                    change: 'created'
                }
            });

            // 메시지 전송 후 전체 메시지 목록 새로 불러오기
            setLoadingMessages(true);
            const data = await fetchChatMessages(roomId);
            setMessages(data.results || []);
            setLoadingMessages(false);
        } catch (err: any) {
            alert(err.message || '메시지 전송 실패');
        }
    };

    // messages가 변경될 때 컨테이너 내부만 스크롤
    useEffect(() => {
        if (messageContainerRef.current) {
            messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight;
        }
    }, [messages]);

    return (
        <div className="w-3/4 bg-white rounded-lg shadow-md p-6 ml-4 flex flex-col min-h-0">
            {/* 채팅방 정보 헤더 */}
            <div className="flex items-center border-b border-gray-100 pb-4 mb-4">
                <div className="relative w-10 h-10 mr-3">
                    <Image
                        src={room?.picture || DEFAULT_ROOM_IMAGE}
                        alt={room?.room_title || '채팅방'}
                        fill
                        className="rounded-full object-cover"
                        sizes="40px"
                    />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="text-lg font-bold truncate">
                        {room?.room_title ?? `채팅방 #${roomId}`}
                    </div>
                    <div className="text-xs text-gray-400">
                        {room?.room_type === 'GROUP'
                            ? '그룹 채팅'
                            : '1:1 채팅'}
                    </div>
                </div>
                <div className="ml-2 text-xs text-gray-400 flex-shrink-0">
                    {room?.recent_message_at
                        ? room.recent_message_at.slice(0, 10)
                        : ''}
                </div>
            </div>

            {/* 채팅 메시지 영역 */}
            <div ref={messageContainerRef} className="flex-1 overflow-y-auto mb-4 space-y-2">
                {loadingMessages ? (
                    <div className="text-center text-gray-400 py-8">메시지 불러오는 중...</div>
                ) : (
                    messages.map((msg, idx) => {
                        const isMe = msg.created_by?.id === myId;
                        let readStatus: 'read' | 'delivered' | 'sending' = 'delivered';
                        if (isMe && idx === messages.length - 1) readStatus = 'read';
                        const isGroup = room?.room_type === 'GROUP';
                        const readCount = isMe && isGroup ? msg.readCount : undefined;
                        return (
                            <div
                                key={msg.id}
                                className={`flex items-end ${isMe ? 'justify-end' : 'justify-start'}`}
                            >
                                <MessageBox
                                    isMe={isMe}
                                    profileImg={msg.created_by?.profile?.picture}
                                    nickname={msg.created_by?.profile?.nickname}
                                    time={msg.created_at?.slice(11, 16)}
                                    theme="ara"
                                    readStatus={isMe ? readStatus : undefined}
                                    readCount={readCount}
                                >
                                    {msg.message_content}
                                </MessageBox>
                            </div>
                        );
                    })
                )}
                <div ref={chatEndRef} />
            </div>

            {/* 입력창 */}
            <form onSubmit={handleSend} className="flex gap-2">
                <input
                    className="flex-1 border rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    type="text"
                    placeholder="메시지를 입력하세요..."
                    value={input}
                    onChange={e => setInput(e.target.value)}
                />
                <button
                    type="submit"
                    className="p-2 rounded-full border border-gray-300 hover:bg-gray-100 transition flex items-center justify-center gap-1"
                    aria-label="메시지 전송"
                >
                    <span className="text-sm font-medium text-gray-700">전송</span>
                    <Image src="/Send.svg" alt="전송" width={20} height={20} />
                </button>
            </form>
        </div>
    );
}
