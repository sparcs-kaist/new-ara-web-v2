'use client';

import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { fetchRecentMessage, fetchChatRoomDetail, fetchChatMessage, readChatRoom } from '@/lib/api/chat';
import { chatSocket } from '@/lib/socket/chat';
import { DELIVERY_KEY } from '@/app/web_view/_query/delivery';
import type { Member, Message } from '../components/ChatRoomDetail';

type SocketSender = {
    user: number | null;
    sender?: { display_name: string; anon_number: number | null };
};

interface UserJoinPayload extends SocketSender {
    type: "user_join";
    room_id: number;
}

interface UserLeavePayload extends SocketSender {
    type: "user_leave";
    room_id: number;
}

interface MessageDeletedPayload {
    type: "message_deleted";
    message_id: number;
}

// type ChatRoomPayloads = UserJoinPayload | UserLeavePayload | MessageDeletedPayload

type RoomUpdatePayload = {
    payload?: RoomUpdatePayload;
    message?: { chat_room?: number; room_id?: number };
    chat_room?: number;
    room_id?: number;
    resource?: string;
    change: string;
    data: { id: number };
    members?: Member[];
};

export function useChatRoomSocket({ roomId, myId, members, setMembers, messages, setMessages, exitTo }: {
    roomId: number;
    myId: number | null;
    members: Member[];
    setMembers: Dispatch<SetStateAction<Member[]>>;
    messages: Message[];
    setMessages: Dispatch<SetStateAction<Message[]>>;
    exitTo: string;
}) {
    const router = useRouter();
    const [typingUsers, setTypingUsers] = useState<Map<number, string>>(new Map()); // [userId, nickname]
    const [forbidden, setForbidden] = useState(false);
    const messagesRef = useRef<Message[]>([]);

    const qc = useQueryClient();

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

        const removeMessage = (messageId: number) => {
            // 정산 요청이 지워져도 서버는 파티 변경을 알리지 않는다; 안 불러온 메시지는 종류를 모르니 함께 다시 가져온다
            const known = messagesRef.current.find(m => m.id === messageId);
            if (!known || known.message_type === 'PAYMENT_REQUEST') {
                qc.invalidateQueries({ queryKey: [...DELIVERY_KEY, 'party'] });
            }
            setMessages(prev => prev.filter(m => m.id !== messageId));
        };

        const syncMessage = async (messageId: number, append: boolean) => {
            const msg: Message = await fetchChatMessage(messageId);
            setMessages(prev =>
                prev.some(m => m.id === messageId)
                    ? prev.map(m => (m.id === messageId ? msg : m))
                    : append ? [...prev, msg] : prev
            );
        };

        // 서버 room_update는 {resource, change, data:{id}}로 id만 주므로 해당 리소스만 다시 가져온다
        const syncResource = async (resource: string, change: string, id: number) => {
            if (resource === 'messages') {
                if (change === 'deleted') removeMessage(id);
                else await syncMessage(id, change === 'created');
            } else if (resource === 'delivery') {
                qc.invalidateQueries({ queryKey: DELIVERY_KEY });
            } else if (resource === 'vote' || resource === 'payment') {
                const type = resource === 'vote' ? 'VOTE' : 'PAYMENT_REQUEST';
                const target = messagesRef.current.find(
                    m => m.message_type === type && (m.attachment as { id?: number } | null)?.id === id
                );
                if (target) await syncMessage(target.id, false);
                else await applyRecent();
                // 취소되면 can_request_payment가 바뀔 수 있어 파티도 다시 가져온다
                if (resource === 'payment') {
                    qc.invalidateQueries({ queryKey: [...DELIVERY_KEY, 'party'] });
                    qc.invalidateQueries({ queryKey: [...DELIVERY_KEY, 'payment'] });
                }
            }
        };

        const eventKey = (p: SocketSender) => p.user ?? p.sender?.anon_number ?? undefined;
        const myAnon = members.find(m => m.is_mine)?.anon_number;
        const isMyEvent = (p: SocketSender) =>
            p.user != null ? p.user === myId : p.sender?.anon_number != null && p.sender.anon_number === myAnon;
        const isEventMember = (m: Member, p: SocketSender) =>
            p.user != null ? m.user?.id === p.user : m.anon_number != null && m.anon_number === p.sender?.anon_number;

        const refreshMembers = async () => {
            try {
                const data = await fetchChatRoomDetail(roomId);
                setMembers(data?.members ?? []);
            } catch { }
        };

        const handleRoomUpdate = async (payload: RoomUpdatePayload) => {
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

            // 1) 반영: 서버 알림이면 해당 리소스, 클라이언트 relay면 최근 메시지 동기화
            if (serverPayload?.resource) {
                try {
                    await syncResource(serverPayload.resource, serverPayload.change, serverPayload.data?.id);
                } catch { }
            } else {
                await applyRecent();
            }

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
        const handleUserJoin = async (payload: UserJoinPayload) => {
            const targetRoomId = payload.room_id // ?? payload?.chat_room ?? payload?.room?.id ?? roomId;
            if (targetRoomId !== roomId) return;

            if (eventKey(payload) !== undefined) {
                const nowIso = new Date().toISOString();
                setMembers(prev => {
                    const idx = prev.findIndex(m => isEventMember(m, payload));
                    if (idx === -1) return prev; // 목록에 없으면 서버 동기화만
                    const next = [...prev];
                    next[idx] = { ...prev[idx], last_seen_at: nowIso };
                    return next;
                });
            }

            if (isMyEvent(payload)) {
                try { await readChatRoom(roomId); } catch { }
            }

            // if (Array.isArray(payload?.members)) {
            //     setMembers(payload.members);
            // } else {
            //     setTimeout(() => { refreshMembers(); }, 300);
            // }
        };

        // NEW: 유저가 방을 나갔을 때(연결 종료) 처리
        const handleUserLeave = (payload: UserLeavePayload) => {
            const userId = eventKey(payload);
            if (userId === undefined) return;
            setTypingUsers(prev => {
                if (!prev.has(userId)) {
                    return prev; // 변경 없음
                }
                const newMap = new Map(prev);
                newMap.delete(userId);
                return newMap;
            });
        };

        // NEW: 메시지 삭제 이벤트 수신 핸들러
        const handleMessageDeleted = (payload: MessageDeletedPayload) => {
            if (payload.message_id) removeMessage(payload.message_id);
        };

        // NEW: 타이핑 시작 이벤트 수신 핸들러
        const handleTypingStart = (payload: SocketSender) => {
            const userId = eventKey(payload);
            if (userId !== undefined && !isMyEvent(payload)) {
                const userProfile = members.find(m => m.user?.id === userId)?.user?.profile;
                const nickname = payload?.sender?.display_name || userProfile?.nickname || `사용자 ${userId}`;
                setTypingUsers(prev => new Map(prev).set(userId, nickname));
            }
        };

        // NEW: 타이핑 종료 이벤트 수신 핸들러
        const handleTypingStop = (payload: SocketSender) => {
            const userId = eventKey(payload);
            if (userId !== undefined) {
                setTypingUsers(prev => {
                    const newMap = new Map(prev);
                    newMap.delete(userId);
                    return newMap;
                });
            }
        };

        // 방 멤버가 아니면 서버가 join을 거절한다
        const handleError = (payload: { code?: string; room_id?: number }) => {
            if (payload.code === 'forbidden' && (payload.room_id == null || payload.room_id === roomId)) setForbidden(true);
        };

        // 배달방에서 나가거나 내보내지면 서버가 이 소켓을 방에서 뺀다
        const handleRemoved = (payload: { room_id?: number }) => {
            if (payload.room_id === roomId) router.replace(exitTo);
        };

        chatSocket.on('room_update', handleRoomUpdate);
        chatSocket.on('user_join', handleUserJoin);
        chatSocket.on('user_leave', handleUserLeave); // 리스너 추가
        chatSocket.on('message_deleted', handleMessageDeleted);
        chatSocket.on('user_typing_start', handleTypingStart);
        chatSocket.on('user_typing_stop', handleTypingStop);
        chatSocket.on('error', handleError);
        chatSocket.on('removed', handleRemoved);
        return () => {
            chatSocket.off('room_update', handleRoomUpdate);
            chatSocket.off('user_join', handleUserJoin);
            chatSocket.off('user_leave', handleUserLeave); // 리스너 제거
            chatSocket.off('message_deleted', handleMessageDeleted);
            chatSocket.off('user_typing_start', handleTypingStart);
            chatSocket.off('user_typing_stop', handleTypingStop);
            chatSocket.off('error', handleError);
            chatSocket.off('removed', handleRemoved);
        };
    }, [roomId, myId, members, qc, router, exitTo, setMessages, setMembers]);

    // 방 입장/퇴장 구독 처리
    useEffect(() => {
        if (!roomId || !myId) return;

        const joinRoom = () => {
            if (chatSocket.join) {
                chatSocket.join(roomId);
                chatSocket.currentRoomId = roomId;
            }
        };

        // 이미 연결된 상태면 바로 처리, 아니면 연결 이벤트 기다림
        if (chatSocket.isConnected?.()) {
            joinRoom();
        }

        const handleConnect = () => {
            joinRoom();
        };
        chatSocket.on('connect', handleConnect);

        return () => {
            chatSocket.off('connect', handleConnect);
            // 컴포넌트 언마운트 시 방 나가기
            if (chatSocket.currentRoomId === roomId) {
                if (chatSocket.leave) {
                    chatSocket.leave(roomId);
                    chatSocket.currentRoomId = null;
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
                chatSocket.send({
                    type: 'update',
                    payload: {
                        room_id: roomId,
                        message: latest
                    }
                });
            } else {
                console.warn('소켓 연결 안됨, 이벤트 전송 실패');
            }
        } catch (socketErr) {
            console.error('Socket event error', socketErr);
        }
    };

    // 소켓 핸들러가 최신 목록에서 투표·정산 메시지를 찾도록
    useEffect(() => {
        messagesRef.current = messages;
    }, [messages]);

    // REST 삭제는 서버가 브로드캐스트하지 않는다
    const dropMessage = (messageId: number) => {
        setMessages(prev => prev.filter(m => m.id !== messageId));
        if (chatSocket.isConnected()) {
            chatSocket.send<MessageDeletedPayload>({
                type: 'message_deleted',
                message_id: messageId,
            });
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

    return { typingUsers, typingText, forbidden, handleMessageSent, dropMessage };
}
