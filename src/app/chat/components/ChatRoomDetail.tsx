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
        // 백엔드 스펙에 맞춘 message_new 이벤트 처리
        const handleMessageNew = (data: any) => {
            console.log('새 메시지 수신:', data);
            if (data.message?.room_id === roomId) {
                fetchChatMessages(roomId, 1, 1, '-created_at').then(d => {
                    const latest = d?.results?.[0];
                    if (!latest) return;
                    // 이미 있으면 스킵
                    setMessages(prev =>
                        prev.some(m => m.id === latest.id) ? prev : [...prev, latest] // 맨 뒤에 추가(최신이 아래)
                    );
                });
            }
        };

        // 유저 입장 이벤트 처리
        const handleUserJoin = (data: any) => {
            if (data.room_id === roomId) {
                console.log(`사용자(${data.user}) 입장`);
                // 필요한 경우 시스템 메시지 추가 또는 상태 업데이트
            }
        };

        // 유저 퇴장 이벤트 처리
        const handleUserLeave = (data: any) => {
            if (data.room_id === roomId) {
                console.log(`사용자(${data.user}) 퇴장`);
                // 필요한 경우 시스템 메시지 추가 또는 상태 업데이트
            }
        };

        // 타이핑 이벤트 처리 (필요한 경우)
        const handleUserTyping = (data: any) => {
            console.log(`사용자(${data.user}) 타이핑 중`);
            // 필요한 경우 타이핑 상태 표시
        };

        // 이벤트 리스너 등록 (백엔드 스펙에 맞게 수정)
        chatSocket.on('message_new', handleMessageNew);
        chatSocket.on('user_join', handleUserJoin);
        chatSocket.on('user_leave', handleUserLeave);
        chatSocket.on('user_typing', handleUserTyping);

        return () => {
            // 컴포넌트 언마운트 시 리스너 제거
            chatSocket.off('message_new', handleMessageNew);
            chatSocket.off('user_join', handleUserJoin);
            chatSocket.off('user_leave', handleUserLeave);
            chatSocket.off('user_typing', handleUserTyping);
        };
    }, [roomId, messages]);    // 메시지 전송
    const handleSend = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!input.trim() || !roomId) return;
        try {
            // 메시지 전송
            const newMessageData = await sendMessage(roomId, input);
            setInput('');

            console.log('메시지 전송 성공:', newMessageData);

            // 서버에서 최신 메시지 가져오기
            const recentMessageData = await fetchChatMessages(roomId, 1, 1, '-created_at');

            if (recentMessageData.results && recentMessageData.results.length > 0) {
                const newMessage = recentMessageData.results[0];
                console.log('최신 메시지 조회:', newMessage);

                // 중복 방지를 위해 ID로 확인 후 추가
                if (!messages.some(msg => msg.id === newMessage.id)) {
                    setMessages(prevMessages => [...prevMessages, newMessage]);
                }
            }

            // 백엔드 스펙에 맞게 message_new 이벤트 전송
            if (!chatSocket.isConnected()) {
                console.error('소켓이 연결되어 있지 않아 메시지 알림을 보낼 수 없습니다.');
            } else if (chatSocket.currentRoomId !== roomId) {
                console.error(`현재 소켓 연결된 방(${chatSocket.currentRoomId})과 메시지 전송 방(${roomId})이 다릅니다.`);
            } else {
                console.log('소켓으로 message_new 이벤트 전송...');
                chatSocket.send({
                    type: 'message_new',
                    message: {
                        id: newMessageData.id,
                        room_id: roomId,
                        sender_id: myId,
                        type: 'text',
                        preview: input.substring(0, 30) + (input.length > 30 ? '...' : ''),
                        created_at: new Date().toISOString()
                    }
                });
            }

            console.log('메시지 업데이트 알림 전송', roomId, newMessageData.id);
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

                        // 이전 메시지와 동일 그룹 여부(프로필/닉네임 숨김, 간격 축소)
                        const isGroupedWithPrev =
                            currentTime === prevTime && prevSender === msg.created_by?.id;

                        // 다음 메시지와 동일 그룹 여부(마지막 메시지에만 시간 표시)
                        const isGroupedWithNext =
                            currentTime === nextTime && nextSender === msg.created_by?.id;

                        const messageSpacing = isGroupedWithPrev ? 'mt-1' : 'mt-4';
                        const showProfile = !isGroupedWithPrev;           // 그룹의 첫 메시지에만 프로필/닉네임
                        const showTime = !isGroupedWithNext;              // 그룹의 마지막 메시지에만 시간

                        return (
                            <div
                                key={messageKey}
                                className={`flex items-end ${isMe ? 'justify-end' : 'justify-start'} ${messageSpacing}`}
                            >
                                <MessageBox
                                    isMe={isMe}
                                    profileImg={showProfile ? msg.created_by?.profile?.picture : undefined}
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
