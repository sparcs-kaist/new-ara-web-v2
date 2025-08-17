/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import MessageBox from './MessageBox';
import { fetchChatMessages, sendMessage, fetchRecentMessage } from '@/lib/api/chat';
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
        // 서버는 -created_at로 최신→오래된 순을 반환하므로, UI에서는 역순으로 표시
        fetchChatMessages(roomId, 1, 50, '-created_at')
            .then(data => {
                const list = data?.results ?? [];
                setMessages(list.slice().reverse()); // 오래된→최신으로 뒤집기
            })
            .finally(() => setLoadingMessages(false));
    }, [roomId]);

    // 소켓 이벤트 리스너 추가
    useEffect(() => {
        // 최신 1개만 가져와 반영
        const applyRecent = async () => {
            const d = await fetchRecentMessage(roomId);
            const latest = d?.results?.[0];
            if (!latest) return;

            setMessages(prev => {
                // id 중복 방지
                if (prev.some(m => m.id === latest.id)) return prev;

                // 혹시 id가 누락된 케이스 대비(선택): 내용/작성자/분 단위 시간으로 근사 중복 체크
                const latestMin = latest.created_at?.slice(0, 16);
                const isNearDup = prev.some(m =>
                    !m.id &&
                    m.message_content === latest.message_content &&
                    m.created_by?.id === latest.created_by?.id &&
                    m.created_at?.slice(0, 16) === latestMin
                );
                if (isNearDup) return prev;

                return [...prev, latest]; // 맨 뒤에 추가(최신 아래)
            });
        };

        const handleRoomUpdate = (data: any) => {
            // 방 일치시만 반영
            const targetRoomId = data?.message?.room_id ?? data?.room_id ?? roomId;
            if (targetRoomId === roomId) {
                applyRecent().catch(console.error);
            }
        };

        chatSocket.on('room_update', handleRoomUpdate);
        // 백엔드가 message_new를 직접 쏘면 이것도 함께 대응(옵션)
        chatSocket.on('message_new', handleRoomUpdate);

        return () => {
            chatSocket.off('room_update', handleRoomUpdate);
            chatSocket.off('message_new', handleRoomUpdate);
        };
    }, [roomId]); // messages 의존성 제거: 중복 리스너 방지

    // 메시지 전송
    const handleSend = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!input.trim() || !roomId) return;
        try {
            // 서버에 전송(HTTP)
            const newMessageData = await sendMessage(roomId, input);
            const sentText = input; // 전송 본문 백업
            setInput('');

            // 최신 1개만 재요청해서 정확한 id로 반영
            const d = await fetchRecentMessage(roomId);
            const latest = d?.results?.[0];
            if (latest) {
                setMessages(prev => (prev.some(m => m.id === latest.id) ? prev : [...prev, latest]));
            }

            // 소켓 알림(옵션)
            if (chatSocket.isConnected() && chatSocket.currentRoomId === roomId) {
                chatSocket.send({
                    type: 'message_new',
                    message: {
                        id: newMessageData.id,
                        room_id: roomId,
                        sender_id: myId,
                        type: 'text',
                        preview: sentText.substring(0, 30) + (sentText.length > 30 ? '...' : ''),
                        created_at: new Date().toISOString(),
                    },
                });
            }
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
            <div ref={messageContainerRef} className="flex-1 overflow-y-auto mb-4 no-scrollbar">
                {loadingMessages ? (
                    <div className="text-center text-gray-400 py-8">메시지 불러오는 중...</div>
                ) : (
                    messages.map((msg, idx) => {
                        const isMe = msg.created_by?.id === myId;
                        let readStatus: 'read' | 'delivered' | 'sending' = 'delivered';
                        if (isMe && idx === messages.length - 1) readStatus = 'read';
                        const isGroupRoom = room?.room_type === 'GROUP';
                        const readCount = isMe && isGroupRoom ? msg.readCount : undefined;

                        const messageKey = msg.id ? `msg-${msg.id}` : `temp-msg-${idx}`;
                        const currentTime = msg.created_at?.slice(11, 16); // HH:MM

                        const prevMsg = idx > 0 ? messages[idx - 1] : null;
                        const prevTime = prevMsg?.created_at?.slice(11, 16);
                        const prevSender = prevMsg?.created_by?.id;

                        const nextMsg = idx < messages.length - 1 ? messages[idx + 1] : null;
                        const nextTime = nextMsg?.created_at?.slice(11, 16);
                        const nextSender = nextMsg?.created_by?.id;

                        // 같은 분(HH:MM) + 같은 발신자면 그룹
                        const isGroupedWithPrev =
                            currentTime === prevTime && prevSender === msg.created_by?.id;
                        const isGroupedWithNext =
                            currentTime === nextTime && nextSender === msg.created_by?.id;

                        const messageSpacing = isGroupedWithPrev ? 'mt-[4px]' : 'mt-[16px]';
                        const showProfile = !isGroupedWithPrev;    // 그룹 첫 메시지에만 프로필/닉네임
                        const showTime = !isGroupedWithNext;       // 그룹 마지막 메시지에만 시간

                        return (
                            <div
                                key={messageKey}
                                className={`flex items-end ${isMe ? 'justify-end' : 'justify-start'} ${messageSpacing} first:mt-0`}
                            >
                                <MessageBox
                                    isMe={isMe}
                                    profileImg={showProfile ? msg.created_by?.profile?.picture ?? null : null}
                                    nickname={showProfile ? msg.created_by?.profile?.nickname : undefined}
                                    time={showTime ? currentTime : undefined}
                                    theme="ara"
                                    readStatus={isMe ? readStatus : undefined}
                                    readCount={readCount}
                                    isGrouped={isGroupedWithPrev}
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
