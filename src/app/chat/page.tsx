'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import MessageBox from './components/MessageBox';
import ChatTypePopover from './components/ChatTypePopover';
import UserSearchDialog from './components/UserSearchDialog';
import { fetchChatRoomList } from '@/lib/api/chat';

// ROOM 타입 정의
type ChatRoom = {
    id: number;
    room_title: string;
    room_type: string;
    chat_name_type: string;
    picture: string;
    recent_message_at: string;
    recent_message: number; // 실제 메시지 id지만, 지금은 사용하지 않음
};

// 예시용 메시지 데이터 (실제 API 데이터와 구조 맞춤)
const mockMessages = [
    {
        id: 1,
        message_type: "TEXT",
        message_content: "안녕하세요! SPARCS입니다.",
        chat_room: 0,
        created_by: {
            id: 1,
            username: "sparcs",
            profile: {
                picture: "https://sparcs-newara-dev.s3.amazonaws.com/user_profiles/default_pictures/gray-default2.png",
                nickname: "SPARCS",
                user: 1,
                is_official: true,
                is_school_admin: false
            }
        },
        created_at: "2025-07-06T08:39:58.013Z",
        readCount: 5 // 상대 메시지에는 표시되지 않음
    },
    {
        id: 2,
        message_type: "TEXT",
        message_content: "안녕하세요! 반가워요.",
        chat_room: 0,
        created_by: {
            id: 0,
            username: "me",
            profile: {
                picture: "https://sparcs-newara-dev.s3.amazonaws.com/user_profiles/default_pictures/gray-default2.png",
                nickname: "나",
                user: 0,
                is_official: false,
                is_school_admin: false
            }
        },
        created_at: "2025-07-06T08:40:10.013Z",
        readCount: 3 // 내 메시지에만 표시됨
    }
];

// 기본 프로필 이미지 (원하는 URL로 교체)
const DEFAULT_ROOM_IMAGE = '/default-room.png';

export default function ChatPage() {
    const [rooms, setRooms] = useState<ChatRoom[]>([]);
    const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
    const [messages, setMessages] = useState<{sender: 'me' | 'other', text: string}[]>([]);
    const [input, setInput] = useState('');
    const chatEndRef = useRef<HTMLDivElement>(null);
    const [showTypePopover, setShowTypePopover] = useState(false);
    const [showUserSearch, setShowUserSearch] = useState(false);

    // 스크롤 항상 아래로
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        fetchChatRoomList()
            .then((data) => {
                setRooms(data.results || []);
                if (data.results && data.results.length > 0) {
                    setSelectedRoomId(data.results[0].id);
                }
            });
    }, []);

    const handleSend = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!input.trim()) return;
        setMessages(prev => [
            ...prev,
            { sender: 'me', text: input },
            { sender: 'other', text: input }, // 상대방이 똑같이 echo
        ]);
        setInput('');
    };

    const handleAddChatRoom = (type: 'DM' | 'GROUP') => {
        if (type === 'DM') {
            setShowUserSearch(true);
        } else {
            alert('단체 채팅방 생성 기능!');
            // 실제 생성 로직 연결
        }
    };

    const handleSelectUser = (user: { id: number; nickname: string }) => {
        alert(`${user.nickname}님과 1:1 채팅방을 생성합니다.`);
        // 실제 DM 생성 로직 연결
    };

    return (
        <div className="h-[calc(100vh-80px)] bg-gray-100 flex px-20 py-8">
            {/* 왼쪽 박스 (채팅방 목록 및 검색 기능) */}
            <div className="w-1/4 bg-white rounded-lg shadow-md p-6 flex flex-col relative">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold">💬채팅방</h2>
                    <div className="relative">
                        <button 
                            className="bg-white rounded-full hover:bg-gray-100 transition p-1"
                            onClick={() => setShowTypePopover((v) => !v)}
                        >
                            <svg 
                                xmlns="http://www.w3.org/2000/svg" 
                                className="h-5 w-5"
                                fill="none" 
                                viewBox="0 0 24 24" 
                                stroke="currentColor"
                            >
                                <path 
                                    strokeLinecap="round" 
                                    strokeLinejoin="round" 
                                    strokeWidth={2} 
                                    d="M12 4v16m8-8H4" 
                                    stroke="black"
                                />
                            </svg>
                        </button>
                        {showTypePopover && (
                            <ChatTypePopover
                                onSelect={handleAddChatRoom}
                                onClose={() => setShowTypePopover(false)}
                            />
                        )}
                    </div>
                </div>
                {/* 검색창 */}
                <input
                    className="mb-4 px-3 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
                    type="text"
                    placeholder="채팅방 검색"
                    disabled
                />
                {/* 채팅방 목록 */}
                <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
                    {rooms.map((room) => {
                        const selected = room.id === selectedRoomId;
                        return (
                            <button
                                key={room.id}
                                className={`w-full flex items-center px-2 py-3 hover:bg-gray-50 transition text-left relative ${
                                    selected ? "bg-gray-50 font-semibold" : "bg-white"
                                }`}
                                onClick={() => setSelectedRoomId(room.id)}
                                style={{ borderRadius: 0 }}
                            >
                                {/* 선택된 방에만 Ara_red 바 표시 */}
                                {selected && (
                                    <div
                                        className="absolute left-0 top-0 h-full"
                                        style={{ width: '4px', background: '#E8443A', borderRadius: '2px' }}
                                    />
                                )}
                                <div className="flex-shrink-0 mr-3 ml-1">
                                    <Image
                                        src={room.picture}
                                        alt={room.room_title}
                                        width={36}
                                        height={36}
                                        className="rounded-full object-cover"
                                    />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-base truncate">{room.room_title}</div>
                                    {/* recent_message는 표시하지 않음 */}
                                </div>
                                <div className="ml-2 text-[10px] text-gray-400 flex-shrink-0">
                                    {room.recent_message_at ? room.recent_message_at.slice(11, 16) : ''}
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>
            {/* 오른쪽 박스 (상세 채팅) */}
            <div className="w-3/4 bg-white rounded-lg shadow-md p-6 ml-4 flex flex-col min-h-0">
                {/* 채팅방 정보 헤더 */}
                <div className="flex items-center border-b border-gray-100 pb-4 mb-4">
                    {(() => {
                        const room = rooms.find(r => r.id === selectedRoomId);
                        if (room?.picture) {
                            return (
                                <Image
                                    src={room.picture}
                                    alt={room.room_title || '채팅방'}
                                    width={40}
                                    height={40}
                                    className="rounded-full object-cover mr-3"
                                />
                            );
                        }
                        return (
                            <Image
                                src={DEFAULT_ROOM_IMAGE}
                                alt="기본 채팅방"
                                width={40}
                                height={40}
                                className="rounded-full object-cover mr-3"
                            />
                        );
                    })()}
                    <div className="flex-1 min-w-0">
                        <div className="text-lg font-bold truncate">
                            {rooms.find(r => r.id === selectedRoomId)?.room_title ?? ''}
                        </div>
                        <div className="text-xs text-gray-400">
                            {rooms.find(r => r.id === selectedRoomId)?.room_type === 'GROUP'
                                ? '그룹 채팅'
                                : '1:1 채팅'}
                        </div>
                    </div>
                    <div className="ml-2 text-xs text-gray-400 flex-shrink-0">
                        {rooms.find(r => r.id === selectedRoomId)?.recent_message_at
                            ? rooms.find(r => r.id === selectedRoomId)!.recent_message_at.slice(0, 10)
                            : ''}
                    </div>
                </div>
                {/* 채팅 메시지 영역 */}
                <div className="flex-1 overflow-y-auto mb-4 space-y-2">
                    {mockMessages.map((msg, idx) => {
                        const isMe = msg.created_by.id === 0;
                        let readStatus: 'read' | 'delivered' | 'sending' = 'delivered';
                        if (isMe && idx === mockMessages.length - 1) readStatus = 'read';

                        // 단체방이면 읽음 숫자 표시 (mockMessages에서 직접 가져옴)
                        const isGroup = rooms.find(r => r.id === selectedRoomId)?.room_type === 'GROUP';
                        const readCount = isMe && isGroup ? msg.readCount : undefined;

                        return (
                            <div
                                key={msg.id}
                                className={`flex items-end ${isMe ? 'justify-end' : 'justify-start'}`}
                            >   
                                <MessageBox
                                    isMe={isMe}
                                    profileImg={msg.created_by.profile.picture}
                                    nickname={msg.created_by.profile.nickname}
                                    time={msg.created_at.slice(11, 16)}
                                    theme="ara"
                                    readStatus={isMe ? readStatus : undefined}
                                    readCount={readCount}
                                >
                                    {msg.message_content}
                                </MessageBox>
                            </div>
                        );
                    })}
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
            <UserSearchDialog
                open={showUserSearch}
                onClose={() => setShowUserSearch(false)}
                onSelectUser={handleSelectUser}
            />
        </div>
    );
}