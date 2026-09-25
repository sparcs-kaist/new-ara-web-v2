/* eslint-disable */
'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import Image from 'next/image';
import MessageBox from './MessageBox';
import ImageMessage from './ImageMessage';
import FileMessage from './FileMessage';
import { fetchChatMessages, /* sendMessage, */ fetchChatRoomDetail, fetchPaymentRequest } from '@/lib/api/chat';
import { fetchMe } from '@/lib/api/user';
// import { uploadAttachments } from '@/lib/api/post';
// import { sendAttachmentMessage } from '@/lib/api/chat';
import { deleteMessage, leaveChatRoom, blockChatRoom, deleteChatRoom, blockDM, createInvitation } from '@/lib/api/chat';
import ChatInput, { type ChatInputExtraRow } from './ChatInput';
import MembersPanel from './MembersPanel';
import MessageContextMenu from './MessageContextMenu';
import NoticeLine from './NoticeLine';
import PaymentCreateSheet, { type PaymentMember } from './PaymentCreateSheet';
import PaymentRequestCard from './PaymentRequestCard';
import UserSearchDialog from './UserSearchDialog'; // 추가
import VoteCard from './VoteCard';
import VoteCreateSheet from './VoteCreateSheet';
import { useChatRoomSocket } from '../hooks/useChatRoomSocket';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useBottomAnchoredScroll } from '@sparcs-kaist/keyboard-inset/react';
import { ConfirmDialog } from '@/app/web_view/_components/ConfirmDialog';
import { Body } from '@/app/web_view/Delivery/_components/DeliveryActionDialog';
import { PostIcon, PostListIcon, SendIcon } from '@/app/web_view/_components/icons';
import { DELIVERY_KEY, useDeliveryParty } from '@/app/web_view/_query/delivery';
import { AnonAvatar } from '@/app/web_view/Delivery/_components/AnonAvatar';
import { CtaButton } from '@/app/web_view/Delivery/_components/BottomCta';
import { DeliveryActionDialog, type DeliveryAction } from '@/app/web_view/Delivery/_components/DeliveryActionDialog';
import { DeliveryComposerNote, DeliveryStatusBar } from '@/app/web_view/Delivery/_components/DeliveryStatusBar';
import { MembersSheet } from '@/app/web_view/Delivery/_components/MembersSheet';
import { OrderCard } from '@/app/web_view/Delivery/_components/OrderCard';
import { OrderSheet } from '@/app/web_view/Delivery/_components/OrderSheet';
import { RoomInfoSheet } from '@/app/web_view/Delivery/_components/RoomInfoSheet';
import { ordersAllowed } from '@/lib/delivery';
import type { ChatPaymentRequest, ChatVote } from '@/lib/types/chat';
import type { DeliveryOrder } from '@/lib/types/delivery';

// ROOM 타입 정의
type ChatRoom = {
    id: number;
    room_title: string;
    room_type: string;
    chat_name_type: string;
    picture: string;
    recent_message_at: string;
    recent_message: number;
    delivery_party?: number | null;
};

// 기본 프로필 이미지
const DEFAULT_ROOM_IMAGE = '/Chatroom_default1.png';

interface ChatRoomDetailProps {
    roomId: number;
    room?: ChatRoom;
    onMenuClick?: () => void; // 메뉴 클릭 핸들러 prop 추가
    /** 나가기/차단/삭제 후 이동할 목록 경로. 웹뷰 셸은 '/web_view/Chat'을 넘긴다. */
    exitTo?: string;
    profileHref?: (userId: number) => string;
    /** 웹뷰 전용. 반응형을 끄고 가장 좁은 폭 기준 UI 하나로 고정한다. */
    compact?: boolean;
}

export interface Message {
    chat_room: number;
    created_at: string;
    created_by: Member["user"];
    expired_at: string;
    id: number;
    message_content: string;
    message_type: string;
    updated_at: string;
    // 익명 방에서는 created_by가 null이고 이름·본인 여부가 sender로 온다 (SYSTEM은 null)
    sender?: { display_name: string; anon_number: number | null; role: string; is_mine: boolean } | null;
    attachment?: unknown;
    attachment_url: string;
    attachment_file: unknown;
}

// 참여자 타입 (API 변경 반영)
export type Member = {
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
    } | null; // 익명 방이면 null
    display_name?: string;
    anon_number?: number | null;
    is_mine?: boolean;
    role?: string;
    last_seen_at?: string | null;
};

type NamedMember = Member & { user: NonNullable<Member['user']> };

type DeliverySheet = { kind: 'order'; order?: DeliveryOrder } | { kind: 'info' } | { kind: 'members' };

// 서버가 삭제를 거부하는 메시지 타입
const UNDELETABLE_TYPES = ['DELIVERY_ORDER', 'DELIVERY_ARRIVAL', 'SYSTEM'];

const senderKey = (msg: Message | null) => msg?.sender?.anon_number ?? msg?.created_by?.id;

export default function ChatRoomDetail({ roomId, room, onMenuClick, exitTo = '/chat', profileHref, compact = false }: ChatRoomDetailProps) {
    const router = useRouter();
    const [messages, setMessages] = useState<Message[]>([]);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [myId, setMyId] = useState<number | null>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);
    const messageContainerRef = useRef<HTMLDivElement>(null);

    const [members, setMembers] = useState<Member[]>([]);
    const [isPanelOpen, setIsPanelOpen] = useState(false);
    const [isInviteDialogOpen, setInviteDialogOpen] = useState(false); // 추가
    const [contextMenu, setContextMenu] = useState<{
        visible: boolean;
        messageId: number | null;
    }>({ visible: false, messageId: null });

    const qc = useQueryClient();
    const [detailRoom, setDetailRoom] = useState<ChatRoom | null>(null);
    const partyId = detailRoom?.id === roomId ? detailRoom.delivery_party ?? null : null;
    const { data: party } = useDeliveryParty(partyId, { poll: true });
    const myOrders = party?.orders?.filter(o => o.orderer.is_mine) ?? [];
    const [sheet, setSheet] = useState<DeliverySheet | null>(null);
    const [action, setAction] = useState<DeliveryAction | null>(null);
    const [promptedFor, setPromptedFor] = useState<string | null>(null);
    const [voteOpen, setVoteOpen] = useState(false);
    const [paymentOpen, setPaymentOpen] = useState(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);
    const [rerequestBlocked, setRerequestBlocked] = useState(false);
    // 방장이 결정해야 하는 상태면 결정 기한마다 한 번 먼저 묻는다
    if (party?.is_host && party.status === 'WAITING_DECISION' && party.decision_deadline_at !== promptedFor) {
        setPromptedFor(party.decision_deadline_at);
        setAction({ kind: party.total_amount < party.min_order_amount ? 'unmet' : 'confirm' });
    }
    const startAction = (next: DeliveryAction) => {
        setSheet(null);
        setAction(next);
    };

    const isMine = (msg: Message) => msg.sender?.is_mine ?? msg.created_by?.id === myId;

    const dmPartner = room?.room_type === 'DM' ? members.find(m => m.user?.id !== myId) : null;

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

    useEffect(() => {
        let alive = true;
        fetchChatRoomDetail(roomId)
            .then((data) => {
                if (!alive) return;
                setMembers(data?.members ?? []);
                setDetailRoom(data?.room ?? null);
            })
            .catch(console.error);
        return () => { alive = false; };
    }, [roomId]);

    const { typingUsers, typingText, forbidden, handleMessageSent, dropMessage } = useChatRoomSocket({ roomId, myId, members, setMembers, messages, setMessages, exitTo });

    // "입력 중" 표시가 나타날 때 자동으로 스크롤하던 로직은 제거합니다.
    // 새 UI는 스크롤 영역 밖에 위치하므로 더 이상 필요하지 않습니다.

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

    const getAttachmentName = (msg: any) => {
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
    const getUnreadCount = (msg: Message) => {
        if (!msg.created_at) return 0;
        const msgTime = new Date(msg.created_at).getTime();
        const senderId = msg.created_by?.id;
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

    // 투표·정산 카드가 제자리에서 바뀔 때는 읽던 위치를 유지한다
    const lastMessageId = messages[messages.length - 1]?.id;
    const partyLoaded = !!party;
    useEffect(() => {
        if (messageContainerRef.current) {
            messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight;
        }
    }, [lastMessageId, partyLoaded]);

    // 컨테이너가 리사이즈될 때(키보드로 채팅 컬럼이 줄어들 때) 바닥 앵커 유지.
    // 사용자가 위로 스크롤해 둔 경우에는 읽던 위치를 그대로 보존한다.
    useBottomAnchoredScroll(messageContainerRef, { pin: 'always' });

    // 메시지 삭제 핸들러
    const handleDeleteMessage = async () => {
        if (!contextMenu.messageId) return;
        const deletedType = messages.find(m => m.id === contextMenu.messageId)?.message_type;

        try {
            await deleteMessage(contextMenu.messageId);
            dropMessage(contextMenu.messageId);
            if (deletedType === 'PAYMENT_REQUEST') qc.invalidateQueries({ queryKey: DELIVERY_KEY });
        } catch (error) {
            console.error("Failed to delete message:", error);
            // 투표·정산은 서버가 거절한 사유를 보여준다 (deleteMessage가 detail을 Error 메시지로 넘긴다)
            if (deletedType === 'VOTE' || deletedType === 'PAYMENT_REQUEST') setDeleteError((error as Error).message);
            else alert("메시지 삭제에 실패했습니다.");
        } finally {
            closeContextMenu();
        }
    };

    const updateAttachment = (messageId: number, attachment: ChatVote | ChatPaymentRequest) => {
        setMessages(prev => prev.map(m => (m.id === messageId ? { ...m, attachment } : m)));
    };

    const handlePaymentChanged = (messageId: number, next: ChatPaymentRequest | null) => {
        if (next) updateAttachment(messageId, next);
        else dropMessage(messageId);
        qc.invalidateQueries({ queryKey: DELIVERY_KEY });
    };

    // 컨텍스트 메뉴 핸들러
    const handleContextMenu = (e: React.MouseEvent, messageId: number) => {
        // 포털(카드의 다이얼로그)에서 버블된 이벤트와 입력칸의 붙여넣기 메뉴는 그대로 둔다
        if (!e.currentTarget.contains(e.target as Node) || (e.target as HTMLElement).closest('input, textarea')) return;
        e.preventDefault();
        setContextMenu({
            visible: true,
            messageId: messageId,
        });
    };

    const closeContextMenu = () => {
        setContextMenu({ visible: false, messageId: null });
    };

    // 초대장 생성 핸들러
    const handleCreateInvitation = async (user: { id: number; nickname: string }) => {
        if (!roomId) return;
        try {
            await createInvitation(roomId, user.id);
            alert(`${user.nickname}님에게 초대장을 보냈습니다.`);
            // 성공 시 다이얼로그를 닫을 수 있습니다.
            setInviteDialogOpen(false);
        } catch (error: unknown) {
            if (error instanceof Error) throw new Error(error.message || '초대장 발송에 실패했습니다.');
        }
    };

    // 채팅방 나가기 핸들러
    const handleLeaveRoom = async () => {
        if (!roomId) return;
        if (window.confirm('정말로 이 채팅방을 나가시겠습니까?')) {
            try {
                await leaveChatRoom(roomId);
                alert('채팅방을 나갔습니다.');
                router.push(exitTo);
            } catch (error) {
                console.error('Failed to leave room:', error);
                alert('채팅방을 나가는 데 실패했습니다.');
            }
        }
    };

    // 사용자 차단 핸들러 (DM용)
    const handleBlockUser = async () => {
        if (!dmPartner?.user) return;
        if (window.confirm(`${dmPartner.user.profile?.nickname || '상대방'}님을 차단하시겠습니까?`)) {
            try {
                await blockDM(dmPartner.user.id);
                alert('사용자를 차단했습니다.');
                router.push(exitTo);
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
                router.push(exitTo);
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
                router.push(exitTo);
            } catch (error) {
                console.error('Failed to delete room:', error);
                alert('채팅방 삭제에 실패했습니다.');
            }
        }
    };

    const menuMessage = contextMenu.visible ? messages.find(m => m.id === contextMenu.messageId) : undefined;
    const menuOrder = menuMessage?.message_type === 'DELIVERY_ORDER' ? (menuMessage.attachment as DeliveryOrder | null) : null;
    const editableOrder =
        menuOrder && party && ordersAllowed(party) && menuOrder.orderer.is_mine && !menuOrder.is_canceled ? menuOrder : null;

    const showOrderCta = !!party && ordersAllowed(party) && !party.is_host && myOrders.length === 0;
    const openPaymentSheet = () => {
        setSheet(null);
        setPaymentOpen(true);
    };
    const openSettlement = () => {
        if (!party) return;
        if (party.can_request_payment) router.push(`/web_view/Delivery/${party.id}/Settlement`);
        else {
            setSheet(null);
            setRerequestBlocked(true);
        }
    };
    const voteRow: ChatInputExtraRow = { label: '투표', icon: PostListIcon, color: 'bg-ara_blue', onSelect: () => setVoteOpen(true) };
    const paymentRow: ChatInputExtraRow = { label: '송금 요청', icon: SendIcon, color: 'bg-[#636363]', onSelect: openPaymentSheet };
    const settling = party?.status === 'ORDERED' || party?.status === 'ARRIVED';
    const deliveryRows: ChatInputExtraRow[] | undefined = party && [
        ...(ordersAllowed(party)
            ? [{ label: '주문 등록', icon: PostIcon, color: 'bg-ara_red', onSelect: () => setSheet({ kind: 'order' }) }]
            : []),
        voteRow,
        ...(party.is_host ? [{ ...paymentRow, label: '배달 정산', onSelect: openSettlement, disabled: !settling }] : []),
        { ...paymentRow, label: '일반 정산' },
    ];
    // 배달방은 파티 참여자에게 익명 번호로, 다른 방은 방 멤버에게 청구한다
    const paymentMembers: PaymentMember[] = party
        ? party.members.filter(m => !m.is_mine).map(m => ({ name: m.display_name, target: { anon_number: m.anon_number } }))
        : members.flatMap((m): PaymentMember[] => {
            if (m.is_mine || (m.user && m.user.id === myId) || m.role === 'BLOCKED' || m.role === 'BLOCKER') return [];
            if (m.user) return [{ name: m.user.profile?.nickname ?? m.display_name ?? '', target: { user: m.user.id } }];
            return m.anon_number != null ? [{ name: m.display_name ?? '', target: { anon_number: m.anon_number } }] : [];
        });
    const myRole = members.find(m => m.is_mine || (m.user && m.user.id === myId))?.role;
    const isRoomAdmin = myRole === 'OWNER' || myRole === 'ADMIN';
    const paymentMessage = party?.payment_request != null
        ? messages.find(m => m.message_type === 'PAYMENT_REQUEST' && (m.attachment as ChatPaymentRequest | null)?.id === party.payment_request)
        : undefined;
    // 정산 요청 메시지가 불러온 최근 메시지 밖이면 상태 바가 '정산 대기'로 돌아가지 않게 따로 불러온다
    const unloadedPaymentId = compact && party?.payment_request != null && !paymentMessage ? party.payment_request : null;
    const { data: unloadedPayment } = useQuery({
        queryKey: [...DELIVERY_KEY, 'payment', unloadedPaymentId],
        queryFn: () => fetchPaymentRequest(unloadedPaymentId as number),
        enabled: unloadedPaymentId !== null,
        staleTime: 5_000,
    });
    const payments = messages.flatMap(m => (m.message_type === 'PAYMENT_REQUEST' && m.attachment ? [m.attachment as ChatPaymentRequest] : []));
    if (unloadedPayment) payments.push(unloadedPayment);

    return (
        // w-3/4를 lg:w-3/4로 변경하고 w-full 추가
        <div className={`w-full ${compact ? '' : 'lg:w-3/4 p-4 lg:p-6 '}bg-white flex flex-col min-h-0 relative overflow-hidden h-full`}>
            {/* 채팅방 정보 헤더 */}
            <div className={`flex items-center border-b border-gray-100 pb-4${party ? '' : ' mb-4'}${compact ? ' px-4 pt-4' : ''}`}>
                {/* 모바일용 메뉴 버튼 (햄버거 아이콘) */}
                <button
                    onClick={onMenuClick}
                    className={`${compact ? '' : 'lg:hidden '}mr-3 p-2 rounded-full hover:bg-gray-100`}
                    aria-label="채팅방 목록 보기"
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <line x1="3" y1="12" x2="21" y2="12"></line>
                        <line x1="3" y1="6" x2="21" y2="6"></line>
                        <line x1="3" y1="18" x2="21" y2="18"></line>
                    </svg>
                </button>

                <div className="relative w-10 h-10 mr-3">
                    {/* 배달방은 사진이 없어 익명 기본 아바타를 쓴다 */}
                    {party ? (
                        <AnonAvatar size={40} />
                    ) : (
                        <Image
                            src={room?.picture || DEFAULT_ROOM_IMAGE}
                            alt={room?.room_title || '채팅방'}
                            fill
                            className="rounded-full object-cover"
                            sizes="40px"
                        />
                    )}
                </div>
                <div
                    className="flex-1 min-w-0"
                    role={party ? 'button' : undefined}
                    onClick={party ? () => setSheet({ kind: 'info' }) : undefined}
                >
                    <div className="text-lg font-bold truncate flex items-center gap-2">
                        <span className="truncate">{room?.room_title ?? party?.store_name ?? `채팅방 #${roomId}`}</span>
                        {/* 참여자 수 표시 */}
                        <span className="text-[20px] text-[#ed3a3a] flex-shrink-0">({party ? party.participant_count : members.length})</span>
                    </div>
                    <div className="text-xs text-gray-400">
                        {party ? party.place_name : room?.room_type === 'GROUP_DM' ? '그룹 채팅' : '1:1 채팅'}
                    </div>
                </div>
                {/* 우측 상단 슬라이드 패널 토글 버튼 */}
                <button
                    type="button"
                    onClick={() => (party ? setSheet({ kind: 'members' }) : setIsPanelOpen(true))}
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

            {party && (
                <DeliveryStatusBar party={party} myOrders={myOrders} payments={payments} />
            )}

            {/* 채팅 메시지 영역 */}
            <div ref={messageContainerRef} className={`flex-1 overflow-y-auto mb-2 no-scrollbar${compact ? ' px-4' : ''}`}>
                {loadingMessages ? (
                    <div className="text-center text-gray-400 py-8">메시지 불러오는 중...</div>
                ) : (
                    messages.map((msg, idx) => {
                        const isMe = isMine(msg);
                        const unreadCount = getUnreadCount(msg);
                        const readCount = unreadCount > 0 ? unreadCount : undefined;

                        const currentDate = (msg.created_at as string).slice(0, 10).split("-").map(e => parseInt(e));
                        const prevDate = idx > 0 ? (messages[idx - 1].created_at as string).slice(0, 10).split("-").map(e => parseInt(e)) : [0, 0, 0];
                        const isDateChanged = !currentDate.every((v, i) => v === prevDate[i])

                        const currentTime = msg.created_at?.slice(11, 16);
                        const prevMsg = idx > 0 ? messages[idx - 1] : null;
                        const prevTime = prevMsg?.created_at?.slice(11, 16);
                        const prevSender = senderKey(prevMsg);
                        const nextMsg = idx < messages.length - 1 ? messages[idx + 1] : null;
                        const nextTime = nextMsg?.created_at?.slice(11, 16);
                        const nextSender = senderKey(nextMsg);

                        const isGroupedWithPrev = currentTime === prevTime && prevSender === senderKey(msg);
                        const isGroupedWithNext = currentTime === nextTime && nextSender === senderKey(msg);
                        const messageSpacing = isGroupedWithPrev ? 'mt-[4px]' : 'mt-[16px]';
                        // const showProfile = !isGroupedWithPrev;
                        const showTime = !isGroupedWithNext;
                        const messageKey = msg.id ? `msg-${msg.id}` : `temp-msg-${idx}`;

                        // 메시지 타입에 따라 내용 구성
                        const mtype = msg.message_type as 'TEXT' | 'IMAGE' | 'FILE' | 'SYSTEM' | 'DELIVERY_ARRIVAL' | 'DELIVERY_ORDER' | 'VOTE' | 'PAYMENT_REQUEST' | undefined;
                        const hasText = mtype !== 'IMAGE' && mtype !== 'FILE' && !!msg.message_content;
                        const hasMenu = !!msg.id && (hasText || isMe);
                        const senderName = msg.sender?.display_name ?? msg.created_by?.profile?.nickname;
                        const dateLine = isDateChanged && (
                            <NoticeLine>{currentDate.map(v => v.toString().padStart(2, "0")).join("-")}</NoticeLine>
                        );

                        if (mtype === 'SYSTEM' || mtype === 'DELIVERY_ARRIVAL') {
                            const place = party && [party.place_name, party.place_detail].filter(Boolean).join(' ');
                            return (
                                <React.Fragment key={messageKey}>
                                    {dateLine}
                                    <NoticeLine className="max-w-[80%] text-center text-xs break-keep">
                                        {mtype === 'DELIVERY_ARRIVAL' && place ? `${place} 도착 ${currentTime}` : msg.message_content}
                                    </NoticeLine>
                                </React.Fragment>
                            );
                        }

                        return (
                            <React.Fragment key={messageKey}>  
                                {dateLine}
                                <div
                                    className={`${messageSpacing} first:mt-0 ${isMe ? 'flex justify-end' : 'flex'}${hasMenu && compact ? ' select-none [-webkit-touch-callout:none]' : ''}`}
                                    onContextMenu={hasMenu ? (e) => handleContextMenu(e, msg.id) : undefined}
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
                                                ) : msg.sender && !msg.created_by ? (
                                                    <AnonAvatar size={36} />
                                                ) : (
                                                    <div className="w-9 h-9" aria-hidden />
                                                )
                                            )}
                                        </div>
                                    )}

                                    <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                        {/* 닉네임 (상대방 메시지일 때만) */}
                                        {!isMe && !isGroupedWithPrev && senderName && (
                                            <div className="text-xs text-gray-600 mb-1">
                                                {senderName}
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
                                        ) : (mtype === 'VOTE' || mtype === 'PAYMENT_REQUEST') && msg.attachment ? (
                                            <MessageBox
                                                isMe={isMe}
                                                time={showTime ? currentTime : undefined}
                                                readCount={readCount}
                                                isGrouped={isGroupedWithPrev}
                                                bare
                                            >
                                                {mtype === 'VOTE' ? (
                                                    <VoteCard
                                                        vote={msg.attachment as ChatVote}
                                                        onChanged={(next) => updateAttachment(msg.id, next)}
                                                    />
                                                ) : (
                                                    <PaymentRequestCard
                                                        payment={msg.attachment as ChatPaymentRequest}
                                                        isHost={(msg.attachment as ChatPaymentRequest).requester.is_mine}
                                                        canDelete={isMe || isRoomAdmin}
                                                        onChanged={(next) => handlePaymentChanged(msg.id, next)}
                                                    />
                                                )}
                                            </MessageBox>
                                        ) : (
                                            <MessageBox
                                                isMe={isMe}
                                                time={showTime ? currentTime : undefined}
                                                theme="ara"
                                                readStatus={unreadCount === 0 ? 'read' : 'delivered'}
                                                readCount={readCount}
                                                isGrouped={isGroupedWithPrev}
                                            >
                                                {mtype === 'DELIVERY_ORDER' && msg.attachment ? (
                                                    <OrderCard order={msg.attachment as DeliveryOrder} isMe={isMe} />
                                                ) : (
                                                    msg.message_content
                                                )}
                                            </MessageBox>
                                        )}
                                    </div>
                                </div>
                            
                            </React.Fragment>  
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

            {party && (showOrderCta ? (
                <div className="shrink-0 border-t border-[#F0F0F0] px-4 py-2">
                    <CtaButton onClick={() => setSheet({ kind: 'order' })}>주문 등록하기</CtaButton>
                </div>
            ) : (
                <DeliveryComposerNote party={party} payments={payments} />
            ))}

            {/* 입력창 */}
            <ChatInput roomId={roomId} myId={myId} onMessageSent={handleMessageSent} compact={compact} extraRows={deliveryRows ?? [voteRow, paymentRow]} />

            <MembersPanel
                isOpen={isPanelOpen}
                onClose={() => setIsPanelOpen(false)}
                // 익명 방은 user가 없어 배달 시트로 참여자를 보여준다
                members={members.filter((m): m is NamedMember => m.user !== null)}
                roomType={room?.room_type}
                myId={myId ?? undefined}
                onLeaveRoom={handleLeaveRoom}
                onBlockUser={handleBlockUser}
                onBlockAndLeave={handleBlockAndLeave}
                onDeleteRoom={handleDeleteRoom}
                onInviteClick={() => setInviteDialogOpen(true)} // 추가
                profileHref={profileHref}
            />

            {/* 컨텍스트 메뉴 렌더링 */}
            {menuMessage && (
                <MessageContextMenu
                    text={menuMessage.message_type !== 'IMAGE' && menuMessage.message_type !== 'FILE' ? menuMessage.message_content : undefined}
                    canDelete={isMine(menuMessage) && !UNDELETABLE_TYPES.includes(menuMessage.message_type)}
                    actions={editableOrder ? [
                        { label: '수정하기', onSelect: () => setSheet({ kind: 'order', order: editableOrder }) },
                        { label: '주문 취소하기', onSelect: () => setAction({ kind: 'cancelOrder', order: editableOrder }), danger: true },
                    ] : undefined}
                    onDelete={handleDeleteMessage}
                    onClose={closeContextMenu}
                />
            )}

            {party && (
                <>
                    <OrderSheet
                        open={sheet?.kind === 'order'}
                        party={party}
                        order={sheet?.kind === 'order' ? sheet.order : undefined}
                        onClose={() => setSheet(null)}
                    />
                    <RoomInfoSheet
                        open={sheet?.kind === 'info'}
                        party={party}
                        onAction={startAction}
                        onSettle={openSettlement}
                        onClose={() => setSheet(null)}
                    />
                    <MembersSheet
                        open={sheet?.kind === 'members'}
                        party={party}
                        onKick={(member) => startAction({ kind: 'kick', member })}
                        onClose={() => setSheet(null)}
                    />
                    {action && (
                        <DeliveryActionDialog
                            key={action.kind}
                            party={party}
                            action={action}
                            onAction={setAction}
                            onClose={() => setAction(null)}
                            onLeft={() => router.replace(exitTo)}
                        />
                    )}
                </>
            )}

            <VoteCreateSheet open={voteOpen} roomId={roomId} onClose={() => setVoteOpen(false)} />
            <PaymentCreateSheet open={paymentOpen} roomId={roomId} members={paymentMembers} onClose={() => setPaymentOpen(false)} />

            {deleteError && (
                <ConfirmDialog
                    title={deleteError}
                    primary={{ label: '확인', onClick: () => setDeleteError(null) }}
                    onClose={() => setDeleteError(null)}
                />
            )}
            {rerequestBlocked && party && (
                <ConfirmDialog
                    title={party.payment_request !== null ? '이미 정산을 요청했어요' : '배달 정산을 다시 보낼 수 없어요'}
                    secondary={{ label: '닫기', onClick: () => setRerequestBlocked(false) }}
                    primary={{
                        label: '일반 정산 보내기',
                        onClick: () => {
                            setRerequestBlocked(false);
                            openPaymentSheet();
                        },
                    }}
                    onClose={() => setRerequestBlocked(false)}
                >
                    <Body>
                        {party.payment_request !== null
                            ? '잘못 보냈다면 정산을 취소하고 다시 보내주세요.'
                            : '송금한 사람이 있어요. 필요한 사람에게 일반 정산을 보내주세요.'}
                    </Body>
                </ConfirmDialog>
            )}

            {forbidden && (
                <ConfirmDialog
                    title="이 채팅방에 참여할 수 없어요"
                    primary={{ label: '확인', onClick: () => router.replace(exitTo) }}
                    onClose={() => router.replace(exitTo)}
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
