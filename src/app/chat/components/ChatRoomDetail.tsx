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
import { deleteMessage, leaveChatRoom, blockChatRoom, deleteChatRoom, blockDM, createInvitation } from '@/lib/api/chat';
import ChatInput from './ChatInput';
import MembersPanel from './MembersPanel';
import MessageContextMenu from './MessageContextMenu';
import UserSearchDialog from './UserSearchDialog'; // 추가
import { useRouter } from 'next/navigation';

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
    onMenuClick?: () => void; // 메뉴 클릭 핸들러 prop 추가
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

export default function ChatRoomDetail({ roomId, room, onMenuClick }: ChatRoomDetailProps) {
    const router = useRouter();
    const [messages, setMessages] = useState<any[]>([]);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [myId, setMyId] = useState<number | null>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);
    const messageContainerRef = useRef<HTMLDivElement>(null);

    // 추가: 참여자 패널 상태/목록
    const [members, setMembers] = useState<Member[]>([]);
    const [isPanelOpen, setIsPanelOpen] = useState(false);
    const [isInviteDialogOpen, setInviteDialogOpen] = useState(false); // 추가
    const [typingUsers, setTypingUsers] = useState<Map<number, string>>(new Map()); // [userId, nickname]
    const [contextMenu, setContextMenu] = useState<{
        visible: boolean;
        x: number;
        y: number;
        messageId: number | null;
    }>({ visible: false, x: 0, y: 0, messageId: null });

    const dmPartner = room?.room_type === 'DM' ? members.find(m => m.user.id !== myId) : null;

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

        // NEW: 유저가 방을 나갔을 때(연결 종료) 처리
        const handleUserLeave = (payload: any) => {
            const userId = payload?.user;
            if (userId) {
                // 만약 나간 유저가 입력 중이었다면, 목록에서 즉시 제거
                setTypingUsers(prev => {
                    if (!prev.has(userId)) {
                        return prev; // 변경 없음
                    }
                    const newMap = new Map(prev);
                    newMap.delete(userId);
                    console.log(`User ${userId} left, removing from typing list.`);
                    return newMap;
                });
            }
        };

        // NEW: 메시지 삭제 이벤트 수신 핸들러
        const handleMessageDeleted = (payload: any) => {
            const deletedMessageId = payload?.message_id;
            if (deletedMessageId) {
                console.log(`메시지 삭제 이벤트 수신: ${deletedMessageId}`);
                setMessages(prev => prev.filter(m => m.id !== deletedMessageId));
            }
        };

        // NEW: 타이핑 시작 이벤트 수신 핸들러
        const handleTypingStart = (payload: any) => {
            const userId = payload?.user;
            if (userId && userId !== myId) {
                const userProfile = members.find(m => m.user.id === userId)?.user.profile;
                const nickname = userProfile?.nickname || `사용자 ${userId}`;
                setTypingUsers(prev => new Map(prev).set(userId, nickname));
            }
        };

        // NEW: 타이핑 종료 이벤트 수신 핸들러
        const handleTypingStop = (payload: any) => {
            const userId = payload?.user;
            if (userId) {
                setTypingUsers(prev => {
                    const newMap = new Map(prev);
                    newMap.delete(userId);
                    return newMap;
                });
            }
        };

        chatSocket.on('room_update', handleRoomUpdate);
        chatSocket.on('user_join', handleUserJoin);
        chatSocket.on('user_leave', handleUserLeave); // 리스너 추가
        chatSocket.on('message_deleted', handleMessageDeleted);
        chatSocket.on('user_typing_start', handleTypingStart);
        chatSocket.on('user_typing_stop', handleTypingStop);
        return () => {
            chatSocket.off('room_update', handleRoomUpdate);
            chatSocket.off('user_join', handleUserJoin);
            chatSocket.off('user_leave', handleUserLeave); // 리스너 제거
            chatSocket.off('message_deleted', handleMessageDeleted);
            chatSocket.off('user_typing_start', handleTypingStart);
            chatSocket.off('user_typing_stop', handleTypingStop);
        };
    }, [roomId, myId, members]); // members 의존성 추가

    // "입력 중" 표시가 나타날 때 자동으로 스크롤하던 로직은 제거합니다.
    // 새 UI는 스크롤 영역 밖에 위치하므로 더 이상 필요하지 않습니다.

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

    // 메시지 삭제 핸들러
    const handleDeleteMessage = async () => {
        if (!contextMenu.messageId) return;

        try {
            await deleteMessage(contextMenu.messageId);
            // UI에서 즉시 메시지 제거
            setMessages(prev => prev.filter(m => m.id !== contextMenu.messageId));

            // 소켓으로 삭제 이벤트 브로드캐스트
            if (chatSocket.isConnected?.()) {
                chatSocket.send?.({
                    type: 'message_deleted',
                    message_id: contextMenu.messageId,
                });
                console.log(`메시지 삭제 이벤트 전송: ${contextMenu.messageId}`);
            }

        } catch (error) {
            console.error("Failed to delete message:", error);
            alert("메시지 삭제에 실패했습니다.");
        } finally {
            closeContextMenu();
        }
    };

    // 컨텍스트 메뉴 핸들러
    const handleContextMenu = (e: React.MouseEvent, messageId: number) => {
        e.preventDefault();
        setContextMenu({
            visible: true,
            x: e.pageX,
            y: e.pageY,
            messageId: messageId,
        });
    };

    const closeContextMenu = () => {
        setContextMenu({ visible: false, x: 0, y: 0, messageId: null });
    };

    // 초대장 생성 핸들러
    const handleCreateInvitation = async (user: { id: number; nickname: string }) => {
        if (!roomId) return;
        try {
            await createInvitation(roomId, user.id);
            alert(`${user.nickname}님에게 초대장을 보냈습니다.`);
            // 성공 시 다이얼로그를 닫을 수 있습니다.
            setInviteDialogOpen(false);
        } catch (error: any) {
            // API 함수에서 던진 에러 메시지를 그대로 사용
            throw new Error(error.message || '초대장 발송에 실패했습니다.');
        }
    };

    // 채팅방 나가기 핸들러
    const handleLeaveRoom = async () => {
        if (!roomId) return;
        if (window.confirm('정말로 이 채팅방을 나가시겠습니까?')) {
            try {
                await leaveChatRoom(roomId);
                alert('채팅방을 나갔습니다.');
                router.push('/chat');
            } catch (error) {
                console.error('Failed to leave room:', error);
                alert('채팅방을 나가는 데 실패했습니다.');
            }
        }
    };

    // 사용자 차단 핸들러 (DM용)
    const handleBlockUser = async () => {
        if (!dmPartner) return;
        if (window.confirm(`${dmPartner.user.profile?.nickname || '상대방'}님을 차단하시겠습니까?`)) {
            try {
                await blockDM(dmPartner.user.id);
                alert('사용자를 차단했습니다.');
                router.push('/chat');
            } catch (error) {
                console.error('Failed to block user:', error);
                alert('사용자 차단에 실패했습니다.');
            }
        }
    };

    // 차단하고 나가기 핸들러 (GROUP_DM용)
    const handleBlockAndLeave = async () => {
        if (!roomId) return;
        if (window.confirm('이 채팅방을 차단하고 나가시겠습니까?')) {
            try {
                await blockChatRoom(roomId);
                alert('채팅방을 차단하고 나갔습니다.');
                router.push('/chat');
            } catch (error) {
                console.error('Failed to block and leave room:', error);
                alert('실패했습니다.');
            }
        }
    };

    // 채팅방 삭제 핸들러 (GROUP_DM 방장용)
    const handleDeleteRoom = async () => {
        if (!roomId) return;
        if (window.confirm('정말로 이 채팅방을 삭제하시겠습니까? 모든 대화 내용이 영구적으로 사라집니다.')) {
            try {
                await deleteChatRoom(roomId);
                alert('채팅방을 삭제했습니다.');
                router.push('/chat');
            } catch (error) {
                console.error('Failed to delete room:', error);
                alert('채팅방 삭제에 실패했습니다.');
            }
        }
    };

    // 타이핑 중인 사용자 닉네임 목록 생성
    const typingUserNicknames = Array.from(typingUsers.values());
    let typingText = '';
    if (typingUserNicknames.length === 1) {
        typingText = `${typingUserNicknames[0]} 님이 입력 중`;
    } else if (typingUserNicknames.length === 2) {
        typingText = `${typingUserNicknames[0]}님과 ${typingUserNicknames[1]}님이 입력 중`;
    } else if (typingUserNicknames.length > 2) {
        typingText = '여러 명이 입력 중';
    }

    return (
        // w-3/4를 lg:w-3/4로 변경하고 w-full 추가
        <div className="w-full lg:w-3/4 bg-white p-4 lg:p-6 flex flex-col min-h-0 relative overflow-hidden">
            {/* 채팅방 정보 헤더 */}
            <div className="flex items-center border-b border-gray-100 pb-4 mb-4">
                {/* 모바일용 메뉴 버튼 (햄버거 아이콘) */}
                <button
                    onClick={onMenuClick}
                    className="lg:hidden mr-3 p-2 rounded-full hover:bg-gray-100"
                    aria-label="채팅방 목록 보기"
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <line x1="3" y1="12" x2="21" y2="12"></line>
                        <line x1="3" y1="6" x2="21" y2="6"></line>
                        <line x1="3" y1="18" x2="21" y2="18"></line>
                    </svg>
                </button>

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
                        {room?.room_type === 'GROUP_DM' ? '그룹 채팅' : '1:1 채팅'}
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
            <div ref={messageContainerRef} className="flex-1 overflow-y-auto mb-2 no-scrollbar">
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
                                onContextMenu={isMe && msg.id ? (e) => handleContextMenu(e, msg.id) : undefined}
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
                {/* "입력 중..." 표시는 이 위치에서 제거합니다. */}

                <div ref={chatEndRef} />
            </div>

            {/* 입력창 바로 위에 표시될 "입력 중..." 텍스트 영역 */}
            <div className="h-6 px-1 text-sm text-gray-500 flex items-center transition-opacity duration-300">
                {typingUsers.size > 0 && (
                    <div className="flex items-center gap-1.5">
                        <span>{typingText}</span>
                        <div className="flex items-center gap-1 ml-1">
                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-pulse"></span>
                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-pulse [animation-delay:0.2s]"></span>
                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-pulse [animation-delay:0.4s]"></span>
                        </div>
                    </div>
                )}
            </div>

            {/* 입력창 */}
            <ChatInput roomId={roomId} myId={myId} onMessageSent={handleMessageSent} />

            <MembersPanel
                isOpen={isPanelOpen}
                onClose={() => setIsPanelOpen(false)}
                members={members}
                roomType={room?.room_type}
                myId={myId ?? undefined}
                onLeaveRoom={handleLeaveRoom}
                onBlockUser={handleBlockUser}
                onBlockAndLeave={handleBlockAndLeave}
                onDeleteRoom={handleDeleteRoom}
                onInviteClick={() => setInviteDialogOpen(true)} // 추가
            />

            {/* 컨텍스트 메뉴 렌더링 */}
            {contextMenu.visible && (
                <MessageContextMenu
                    x={contextMenu.x}
                    y={contextMenu.y}
                    onDelete={handleDeleteMessage}
                    onClose={closeContextMenu}
                />
            )}

            {/* 초대 다이얼로그 렌더링 */}
            <UserSearchDialog
                open={isInviteDialogOpen}
                onClose={() => setInviteDialogOpen(false)}
                onSelectUser={handleCreateInvitation}
                title="멤버 초대하기"
                actionText="초대"
            />
        </div>
    );
}
