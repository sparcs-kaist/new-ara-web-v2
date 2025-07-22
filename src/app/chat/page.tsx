'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import MessageBox from './components/MessageBox';
import ChatTypePopover from './components/ChatTypePopover';
import UserSearchDialog from './components/UserSearchDialog';
import RoomCreateDialog from './components/RoomCreateDialog'; 
import { fetchChatRoomList, fetchChatMessages, sendMessage } from '@/lib/api/chat';
import { createGroupDM } from '@/lib/api/chat';
import { fetchMe } from '@/lib/api/user';

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

// 기본 프로필 이미지 (원하는 URL로 교체)
const DEFAULT_ROOM_IMAGE = '/default-room.png';

export default function ChatPage() {
    const [rooms, setRooms] = useState<ChatRoom[]>([]);
    const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [input, setInput] = useState('');
    const chatEndRef = useRef<HTMLDivElement>(null);
    const [showTypePopover, setShowTypePopover] = useState(false);
    const [showUserSearch, setShowUserSearch] = useState(false);
    const [showRoomCreate, setShowRoomCreate] = useState(false); // RoomCreateDialog 제어 상태 추가
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [myId, setMyId] = useState<number | null>(null); // 내 ID 저장 (fetchMe) -> 메시지 UI를 위해서.

    // 스크롤 항상 아래로
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // 내 ID 가져오기
    useEffect(() => {
        fetchMe()
            .then((data) => {
                setMyId(data.user);
            });
    }, []);

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
                    setSelectedRoomId(sortedRooms[0].id);
                }
            });
    }, []);

    // 채팅방 선택 시 메시지 목록 불러오기
    useEffect(() => {
        if (selectedRoomId == null) return;
        setLoadingMessages(true);
        fetchChatMessages(selectedRoomId)
            .then(data => setMessages(data.results || []))
            .finally(() => setLoadingMessages(false));
    }, [selectedRoomId]);

    // 메시지 전송
    const handleSend = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!input.trim() || selectedRoomId == null) return;
        try {
            await sendMessage(selectedRoomId, input);
            setInput('');
            // 메시지 전송 후 전체 메시지 목록 새로 불러오기
            setLoadingMessages(true);
            const data = await fetchChatMessages(selectedRoomId);
            setMessages(data.results || []);
            setLoadingMessages(false);
        } catch (err: any) {
            alert(err.message || '메시지 전송 실패');
        }
    };

    const handleAddChatRoom = async (type: 'DM' | 'GROUP') => {
        if (type === 'DM') {
            setShowUserSearch(true);
        } else {
            setShowRoomCreate(true); // RoomCreateDialog 오픈
        }
    };

    const handleSelectUser = (user: { id: number; nickname: string }) => {
        alert(`${user.nickname}님과 1:1 채팅방을 생성합니다.`);
        // 실제 DM 생성 로직 연결
    };

    const handleCreateGroupRoom = async ({ title, picture }: { title: string; picture: File | null }) => {
        await createGroupDM(title, picture);
        setShowRoomCreate(false);
        // 채팅방 목록 새로고침
        const data = await fetchChatRoomList();
        const sortedRooms = [...(data.results || [])].sort((a, b) => {
            const aTime = new Date(a.recent_message_at || a.created_at || 0).getTime();
            const bTime = new Date(b.recent_message_at || b.created_at || 0).getTime();
            return bTime - aTime;
        });
        setRooms(sortedRooms);
        if (sortedRooms.length > 0) {
            setSelectedRoomId(sortedRooms[0].id);
        }
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
                                <div className="flex-shrink-0 w-9 h-9 relative mr-3 ml-1">
                                    <Image
                                        src={room.picture}
                                        alt={room.room_title}
                                        fill
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
                        return (
                            <div className="relative w-10 h-10 mr-3">
                                <Image
                                    src={room?.picture || DEFAULT_ROOM_IMAGE}
                                    alt={room?.room_title || '채팅방'}
                                    fill
                                    className="rounded-full object-cover"
                                    sizes="40px"
                                />
                            </div>
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
                    {loadingMessages ? (
                        <div className="text-center text-gray-400 py-8">메시지 불러오는 중...</div>
                    ) : (
                        messages.map((msg, idx) => {
                            const isMe = msg.created_by?.id === myId;
                            let readStatus: 'read' | 'delivered' | 'sending' = 'delivered';
                            if (isMe && idx === messages.length - 1) readStatus = 'read';
                            const isGroup = rooms.find(r => r.id === selectedRoomId)?.room_type === 'GROUP';
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
                                        theme="cat"
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
            <UserSearchDialog
                open={showUserSearch}
                onClose={() => setShowUserSearch(false)}
                onSelectUser={handleSelectUser}
            />
            <RoomCreateDialog
                open={showRoomCreate}
                onClose={() => setShowRoomCreate(false)}
                onCreate={handleCreateGroupRoom}
            />
        </div>
    );
}