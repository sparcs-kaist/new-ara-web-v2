/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import MessageBox from './MessageBox';
import ImageMessage from './ImageMessage';
import FileMessage from './FileMessage';
import { fetchChatMessages, sendMessage, fetchRecentMessage, fetchChatRoomDetail } from '@/lib/api/chat';
import { readChatRoom } from '@/lib/api/chat';
import { fetchMe } from '@/lib/api/user';
import { chatSocket } from '@/lib/socket/chat';
import { uploadAttachments } from '@/lib/api/post';
import { sendAttachmentMessage } from '@/lib/api/chat';
import ChatInput from './ChatInput';

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

// 참여자 타입 (API 변경 반영)
type Member = {
    user: {
        id: number;
        username?: string;
        profile?: {
            picture?: string;
            nickname?: string;
            user?: number;
            is_official?: boolean;
            is_school_admin?: boolean;
        };
    };
    role?: string;
    last_seen_at?: string | null;
};

export default function ChatRoomDetail({ roomId, room }: ChatRoomDetailProps) {
    const [messages, setMessages] = useState<any[]>([]);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [myId, setMyId] = useState<number | null>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);
    const messageContainerRef = useRef<HTMLDivElement>(null);

    // 추가: 참여자 패널 상태/목록
    const [members, setMembers] = useState<Member[]>([]);
    const [isPanelOpen, setIsPanelOpen] = useState(false);

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

    // 방 상세(참여자) 불러오기 (API 응답 구조 변경 반영)
    useEffect(() => {
        let alive = true;
        fetchChatRoomDetail(roomId)
            .then((data) => {
                if (!alive) return;
                setMembers(data?.members ?? []);
            })
            .catch(console.error);
        return () => { alive = false; };
    }, [roomId]);

    // 소켓 이벤트 리스너 추가
    useEffect(() => {
        // 최신 1개만 가져와 반영
        const applyRecent = async () => {
            const d = await fetchRecentMessage(roomId);
            const latest = d?.results?.[0];
            if (!latest) return;

            setMessages(prev => {
                if (prev.some(m => m.id === latest.id)) return prev;
                const latestMin = latest.created_at?.slice(0, 16);
                const isNearDup = prev.some(m =>
                    !m.id &&
                    m.message_content === latest.message_content &&
                    m.created_by?.id === latest.created_by?.id &&
                    m.created_at?.slice(0, 16) === latestMin
                );
                if (isNearDup) return prev;
                return [...prev, latest];
            });
        };

        const refreshMembers = async () => {
            try {
                const data = await fetchChatRoomDetail(roomId);
                setMembers(data?.members ?? []);
            } catch { }
        };

        const handleRoomUpdate = async (payload: any) => {
            console.log('소켓 update 이벤트 수신:', payload);

            // payload 필드가 있다면 그것을 사용 (서버 브로드캐스트 구조)
            const serverPayload = payload?.payload || payload;

            // room id can be in different fields
            const targetRoomId =
                serverPayload?.message?.chat_room ??
                serverPayload?.message?.room_id ??
                serverPayload?.chat_room ??
                serverPayload?.room_id ??
                payload?.room_id ??
                roomId;

            if (targetRoomId !== roomId) return;

            console.log('update: 현재 방 이벤트 확인됨, 메시지 동기화');

            // 1) 반영: 최근 메시지 동기화
            await applyRecent();

            // 2) 읽음 처리 + 즉시 내 last_seen_at 낙관 갱신
            try {
                await readChatRoom(roomId);
                setMembers(prev =>
                    prev.map(m =>
                        m.user?.id === myId ? { ...m, last_seen_at: new Date().toISOString() } : m
                    )
                );
            } catch { }

            // 3) 서버가 members를 보내주면 그대로 사용, 아니면 재조회
            if (Array.isArray(payload?.members)) {
                setMembers(payload.members);
            } else {
                // 약간의 지연 후 재조회(상대 클라이언트의 read 반영 시간 고려)
                setTimeout(() => {
                    refreshMembers();
                }, 300);
            }
        };

        // NEW: 유저가 방에 진입했을 때(접속) 처리
        const handleUserJoin = async (payload: any) => {
            const targetRoomId =
                payload?.room_id ?? payload?.chat_room ?? payload?.room?.id ?? roomId;
            if (targetRoomId !== roomId) return;

            const joinedUserId =
                typeof payload?.user === 'object' ? payload?.user?.id : payload?.user;

            // 1) 낙관적 업데이트: 해당 유저의 last_seen_at을 지금으로
            if (joinedUserId) {
                const nowIso = new Date().toISOString();
                setMembers(prev => {
                    const idx = prev.findIndex(m => m.user?.id === joinedUserId);
                    if (idx === -1) return prev; // 목록에 없으면 서버 동기화만
                    const next = [...prev];
                    next[idx] = { ...prev[idx], last_seen_at: nowIso };
                    return next;
                });
            }

            // 2) 내가 입장한 이벤트면 서버에 읽음 처리
            if (joinedUserId && myId && joinedUserId === myId) {
                try { await readChatRoom(roomId); } catch { }
            }

            // 3) 서버 기준으로 재동기화(서버가 members를 보내주면 그대로 사용)
            if (Array.isArray(payload?.members)) {
                setMembers(payload.members);
            } else {
                setTimeout(() => { refreshMembers(); }, 300);
            }
        };

        chatSocket.on('room_update', handleRoomUpdate);
        chatSocket.on('user_join', handleUserJoin);
        return () => {
            chatSocket.off('room_update', handleRoomUpdate);
            chatSocket.off('user_join', handleUserJoin);
        };
    }, [roomId, myId]); // messages 의존성 제거: 중복 리스너 방지

    // 방 입장/퇴장 구독 처리
    useEffect(() => {
        if (!roomId || !myId) return;

        const joinRoom = () => {
            // join 처리
            console.log(`join room ${roomId}`);
            if (chatSocket.join) {
                chatSocket.join(roomId);
                chatSocket.currentRoomId = roomId;
            }
            try {
                chatSocket.send?.({
                    type: 'user_join',
                    room_id: roomId,
                    user: myId
                });
            } catch (e) {
                console.error('Socket join error', e);
            }

            // 디버깅: 소켓 연결 확인
            console.log(`소켓 연결 상태: ${chatSocket.isConnected?.()}, 현재 방: ${chatSocket.currentRoomId}`);
        };

        // 이미 연결된 상태면 바로 처리, 아니면 연결 이벤트 기다림
        if (chatSocket.isConnected?.()) {
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
            // 컴포넌트 언마운트 시 방 나가기
            if (chatSocket.currentRoomId === roomId) {
                console.log(`컴포넌트 언마운트: ${roomId} 방에서 나갑니다.`);
                if (chatSocket.leave) {
                    chatSocket.leave(roomId);
                    chatSocket.currentRoomId = null;
                }

                try {
                    chatSocket.send?.({
                        type: 'user_leave',
                        room_id: roomId,
                        user: myId
                    });
                } catch (e) {
                    console.error('Socket leave error', e);
                }
            }
        };
    }, [roomId, myId]);

    // 메시지 전송 후 처리
    const handleMessageSent = async () => {
        // 최신 1개 동기화
        const d = await fetchRecentMessage(roomId);
        const latest = d?.results?.[0];
        if (latest) {
            setMessages(prev => (prev.some(m => m.id === latest.id) ? prev : [...prev, latest]));
        }

        // 읽음 처리
        try {
            await readChatRoom(roomId);
            setMembers(prev =>
                prev.map(m => (m.user?.id === myId ? { ...m, last_seen_at: new Date().toISOString() } : m)),
            );
        } catch { }
        // 전송 완료 후 update 소켓 이벤트 발신
        try {
            if (chatSocket.isConnected?.()) {
                console.log('소켓 이벤트 전송 시도');
                chatSocket.send?.({
                    type: 'update',
                    payload: {
                        room_id: roomId,
                        message: latest
                    }
                });

                console.log('소켓 이벤트 전송 완료');
            } else {
                console.warn('소켓 연결 안됨, 이벤트 전송 실패');
            }
        } catch (socketErr) {
            console.error('Socket event error', socketErr);
        }
    };

    // 메시지의 첨부 URL 추출 헬퍼 (message_content에서도 fallback)
    const getAttachmentUrl = (msg: any): string | undefined => {
        const byAttachment =
            msg?.attachment?.file || msg?.attachment_file || msg?.attachment_url || msg?.attachment?.url;
        if (byAttachment) return byAttachment;
        if (msg?.message_type === 'IMAGE' || msg?.message_type === 'FILE') {
            return typeof msg?.message_content === 'string' ? msg.message_content : undefined;
        }
        return undefined;
    };

    const getAttachmentName = (msg: any): string | undefined => {
        const n = msg?.attachment?.name;
        if (n) return n;
        const url = getAttachmentUrl(msg) || (typeof msg?.message_content === 'string' ? msg.message_content : undefined);
        if (!url) return undefined;
        try {
            return decodeURIComponent(new URL(url).pathname.split('/').pop() || '');
        } catch {
            const parts = url.split('/');
            return parts[parts.length - 1];
        }
    };

    // 메시지 기준 미확인(안 읽은) 인원 수 계산
    const getUnreadCount = (msg: any) => {
        if (!msg?.created_at) return 0;
        const msgTime = new Date(msg.created_at).getTime();
        const senderId = msg?.created_by?.id;
        // 카운트 기준: (1) 보낸 사람 제외 (2) last_seen_at이 없거나, msgTime 이후인 경우만 읽지 않음으로 간주
        const unread = members.reduce((acc, m) => {
            const uid = m.user?.id;
            if (!uid || uid === senderId) return acc; // 보낸 사람 제외
            const seenAt = m.last_seen_at ? new Date(m.last_seen_at).getTime() : null;
            const isUnread = !seenAt || seenAt < msgTime;
            return acc + (isUnread ? 1 : 0);
        }, 0);

        return unread;
    };

    // messages가 변경될 때 컨테이너 내부만 스크롤
    useEffect(() => {
        if (messageContainerRef.current) {
            messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight;
        }
    }, [messages]);

    return (
        <div className="w-3/4 bg-white rounded-lg shadow-md p-6 ml-4 flex flex-col min-h-0 relative overflow-hidden">
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
                    <div className="text-lg font-bold truncate flex items-center gap-2">
                        <span className="truncate">{room?.room_title ?? `채팅방 #${roomId}`}</span>
                        {/* 참여자 수 표시 */}
                        <span className="text-[20px] text-[#ed3a3a] flex-shrink-0">({members.length})</span>
                    </div>
                    <div className="text-xs text-gray-400">
                        {room?.room_type === 'GROUP' ? '그룹 채팅' : '1:1 채팅'}
                    </div>
                </div>
                {/* 우측 상단 슬라이드 패널 토글 버튼 */}
                <button
                    type="button"
                    onClick={() => setIsPanelOpen(true)}
                    className="ml-3 p-2 rounded-full hover:bg-gray-100 transition-colors flex items-center justify-center"
                    aria-label="참여자 보기"
                >
                    {/* 사람 아이콘 (가운데 정렬 버전) */}
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="text-gray-600">
                        <path d="M20 21v-2a4 4 0 0 0-4-4h-8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                        <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </button>
            </div>

            {/* 채팅 메시지 영역 */}
            <div ref={messageContainerRef} className="flex-1 overflow-y-auto mb-4 no-scrollbar">
                {loadingMessages ? (
                    <div className="text-center text-gray-400 py-8">메시지 불러오는 중...</div>
                ) : (
                    messages.map((msg, idx) => {
                        const isMe = msg.created_by?.id === myId;
                        const unreadCount = getUnreadCount(msg);
                        const readCount = unreadCount > 0 ? unreadCount : undefined;

                        const currentTime = msg.created_at?.slice(11, 16);
                        const prevMsg = idx > 0 ? messages[idx - 1] : null;
                        const prevTime = prevMsg?.created_at?.slice(11, 16);
                        const prevSender = prevMsg?.created_by?.id;
                        const nextMsg = idx < messages.length - 1 ? messages[idx + 1] : null;
                        const nextTime = nextMsg?.created_at?.slice(11, 16);
                        const nextSender = nextMsg?.created_by?.id;

                        const isGroupedWithPrev = currentTime === prevTime && prevSender === msg.created_by?.id;
                        const isGroupedWithNext = currentTime === nextTime && nextSender === msg.created_by?.id;
                        const messageSpacing = isGroupedWithPrev ? 'mt-[4px]' : 'mt-[16px]';
                        const showProfile = !isGroupedWithPrev;
                        const showTime = !isGroupedWithNext;
                        const messageKey = msg.id ? `msg-${msg.id}` : `temp-msg-${idx}`;

                        // 메시지 타입에 따라 내용 구성
                        const mtype = msg.message_type as 'TEXT' | 'IMAGE' | 'FILE' | undefined;

                        return (
                            <div
                                key={messageKey}
                                className={`${messageSpacing} first:mt-0 ${isMe ? 'flex justify-end' : 'flex'}`}
                            >
                                {/* 프로필 이미지 (메시지 타입 상관없이 동일) */}
                                {!isMe && (
                                    <div className={`flex-shrink-0 mr-2 w-9 ${isGroupedWithPrev ? 'h-0' : 'h-9'}`}>
                                        {!isGroupedWithPrev && (
                                            msg.created_by?.profile?.picture ? (
                                                <Image
                                                    src={msg.created_by.profile.picture}
                                                    alt={msg.created_by.profile?.nickname || ''}
                                                    width={36}
                                                    height={36}
                                                    className="rounded-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-9 h-9" aria-hidden />
                                            )
                                        )}
                                    </div>
                                )}

                                <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                    {/* 닉네임 (상대방 메시지일 때만) */}
                                    {!isMe && !isGroupedWithPrev && msg.created_by?.profile?.nickname && (
                                        <div className="text-xs text-gray-600 mb-1">
                                            {msg.created_by.profile.nickname}
                                        </div>
                                    )}

                                    {/* 메시지 타입별 다른 UI */}
                                    {mtype === 'IMAGE' ? (
                                        <ImageMessage
                                            url={getAttachmentUrl(msg) || msg.message_content}
                                            alt={getAttachmentName(msg)}
                                            isMe={isMe}
                                            time={showTime ? currentTime : undefined}
                                            readCount={readCount}
                                        />
                                    ) : mtype === 'FILE' ? (
                                        <FileMessage
                                            url={getAttachmentUrl(msg) || msg.message_content}
                                            name={getAttachmentName(msg) || '파일'}
                                            isMe={isMe}
                                            time={showTime ? currentTime : undefined}
                                            readCount={readCount}
                                        />
                                    ) : (
                                        <MessageBox
                                            isMe={isMe}
                                            time={showTime ? currentTime : undefined}
                                            theme="ara"
                                            readStatus={unreadCount === 0 ? 'read' : 'delivered'}
                                            readCount={readCount}
                                            isGrouped={isGroupedWithPrev}
                                        >
                                            {msg.message_content}
                                        </MessageBox>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={chatEndRef} />
            </div>

            {/* 입력창 */}
            <ChatInput roomId={roomId} onMessageSent={handleMessageSent} />

            {/* 오른쪽 슬라이드 패널 (참여자 목록) - 컴포넌트 영역 내부 */}
            <div className={`absolute inset-0 z-30 ${isPanelOpen ? '' : 'pointer-events-none'}`}>
                <div
                    className={`absolute inset-0 bg-black/20 transition-opacity duration-300 ${isPanelOpen ? 'opacity-100' : 'opacity-0'}`}
                    onClick={() => setIsPanelOpen(false)}
                />
                <aside
                    className={`absolute right-0 top-0 h-full w-[320px] bg-white shadow-xl border-l transform transition-transform duration-300 ${isPanelOpen ? 'translate-x-0' : 'translate-x-full'}`}
                    aria-label="참여자 목록"
                >
                    <div className="flex items-center justify-between px-4 py-3 border-b">
                        <div className="font-semibold">멤버 : {members.length}명</div>
                        <button onClick={() => setIsPanelOpen(false)} className="p-1 rounded hover:bg-gray-100" aria-label="닫기">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                                <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                            </svg>
                        </button>
                    </div>
                    <div className="p-3 overflow-y-auto h-[calc(100%-48px)]">
                        {members.length === 0 ? (
                            <div className="text-sm text-gray-500 py-6 text-center">참여자가 없습니다.</div>
                        ) : (
                            <ul className="space-y-2">
                                {members.map((m) => (
                                    <li key={m.user.id} className="flex items-center gap-3">
                                        <div className="relative w-9 h-9">
                                            <Image
                                                src={m.user.profile?.picture || '/default-room.png'}
                                                alt={m.user.profile?.nickname || '참여자'}
                                                fill
                                                className="rounded-full object-cover"
                                                sizes="36px"
                                            />
                                        </div>
                                        <div className="min-w-0">
                                            <div className="text-sm text-gray-900 truncate">
                                                {m.user.profile?.nickname || `사용자 ${m.user.id}`}
                                            </div>
                                            <div className="text-xs text-gray-500 truncate">
                                                마지막 접속: {m.last_seen_at ? new Date(m.last_seen_at).toLocaleString() : '정보 없음'}
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </aside>
            </div>
        </div>
    );
}
