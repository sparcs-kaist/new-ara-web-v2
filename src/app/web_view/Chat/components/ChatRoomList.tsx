/* eslint-disable @typescript-eslint/no-explicit-any */

// 웹뷰 전용 채팅방 목록 컴포넌트
'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import UserSearchDialog from '@/app/chat/components/UserSearchDialog';
import RoomCreateDialog from '@/app/chat/components/RoomCreateDialog';
import { PlusIcon, InformationIcon, ChoiceChip, ChoiceChipRow } from '@/app/web_view/_components';
import { fetchChatRoomList, createGroupDM, createDM, getDmByUserId } from '@/lib/api/chat';
import InvitationListDialog from '@/app/chat/components/InvitationListDialog';

// ROOM 타입 정의
type RecentMessage = {
    id: number;
    message_type: 'TEXT' | 'IMAGE' | 'FILE' | string;
    message_content: string;
    created_by: {
        id: number;
        profile?: {
            picture?: string;
            nickname?: string;
            user?: number;
            is_official?: boolean;
            is_school_admin?: boolean;
        };
    };
    created_at: string;
    updated_at?: string;
    expired_at?: string | null;
};

type ChatRoom = {
    id: number;
    room_title: string;
    room_type: string;
    chat_name_type: string;
    picture?: string;
    recent_message_at?: string;
    recent_message?: RecentMessage;
    created_at?: string;
};

const TABS = [
    { key: null, label: '전체', empty: '채팅방이 없습니다.' },
    { key: 'dm', label: '쪽지', type: 'DM', empty: '쪽지가 없어요' },
    { key: 'group', label: '그룹 채팅', type: 'GROUP_DM', empty: '그룹 채팅이 없어요' },
    { key: 'delivery', label: '함께 배달', type: 'DELIVERY', empty: '함께 배달 채팅방이 없어요' },
];

interface ChatRoomListProps {
    onRoomClick: (roomId: number) => void;
}

export default function ChatRoomList({ onRoomClick }: ChatRoomListProps) {
    const [rooms, setRooms] = useState<ChatRoom[]>([]);
    const [loaded, setLoaded] = useState(false);
    const [showTypePopover, setShowTypePopover] = useState(false);
    const [showUserSearch, setShowUserSearch] = useState(false);
    const [showRoomCreate, setShowRoomCreate] = useState(false);
    const [showInvitationDialog, setShowInvitationDialog] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const router = useRouter();
    const tabParam = useSearchParams().get('tab');
    const tab = TABS.find((t) => t.key === tabParam) ?? TABS[0];
    const visibleRooms = tab.type ? rooms.filter((room) => room.room_type === tab.type) : rooms;

    const refreshRoomList = () => {
        fetchChatRoomList()
            .then((data) => {
                const sortedRooms = [...(data.results || [])].sort((a, b) => {
                    const aTime = new Date(a.recent_message_at || a.created_at || 0).getTime();
                    const bTime = new Date(b.recent_message_at || b.created_at || 0).getTime();
                    return bTime - aTime;
                });
                setRooms(sortedRooms);
            })
            .catch((e) => console.warn('fetchChatRoomList failed', e))
            .finally(() => setLoaded(true));
    };

    useEffect(() => {
        refreshRoomList();
    }, []);

    useEffect(() => {
        if (!showTypePopover) return;
        const onDown = (e: MouseEvent) => {
            if (!menuRef.current?.contains(e.target as Node)) setShowTypePopover(false);
        };
        document.addEventListener('mousedown', onDown);
        return () => document.removeEventListener('mousedown', onDown);
    }, [showTypePopover]);

    const handleAddChatRoom = async (type: 'DM' | 'GROUP') => {
        setShowTypePopover(false);
        if (type === 'DM') {
            setShowUserSearch(true);
        } else {
            setShowRoomCreate(true);
        }
    };

    const handleSelectUser = async (user: { id: number; nickname: string }) => {
        try {
            const { dm_room } = await getDmByUserId(user.id);
            if (dm_room != null) {
                setShowUserSearch(false);
                router.push(`/web_view/Chat/${dm_room}`);
                return;
            }
            // 1. createDM API를 호출하여 1:1 채팅방 생성을 시도합니다.
            const newRoom = await createDM(user.id);
            // 2. 성공하면 검색 다이얼로그를 닫습니다.
            setShowUserSearch(false);
            // 3. 생성된 채팅방으로 사용자를 이동시킵니다.
            router.push(`/web_view/Chat/${newRoom.id}`);
        } catch (error: any) {
            // 4. 에러가 발생하면 (ex: 이미 채팅방이 존재) UserSearchDialog가
            //    에러 메시지를 alert로 띄워줄 수 있도록 에러를 다시 던집니다.
            throw error;
        }
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
    };

    return (
        <>
            <header className="sticky top-[var(--ara-safe-top)] z-40 flex h-14 items-center bg-white px-5">
                <h1 className="text-[28px] font-bold text-ara_red">채팅</h1>
                <div className="ml-auto flex items-center">
                    <div className="relative" ref={menuRef}>
                        <button
                            type="button"
                            onClick={() => setShowTypePopover((v) => !v)}
                            aria-label="새 채팅"
                            className="flex h-11 w-11 items-center justify-center rounded-full text-ara_red"
                        >
                            <PlusIcon size={32} />
                        </button>
                        {showTypePopover && (
                            <div
                                role="menu"
                                className="absolute right-0 top-full z-50 mt-1 min-w-[120px] overflow-hidden rounded-[10px] border border-[#F0F0F0] bg-white"
                            >
                                <button
                                    type="button"
                                    onClick={() => handleAddChatRoom('DM')}
                                    className="block w-full bg-transparent px-[14px] py-[10px] text-left text-[14px] text-black"
                                >
                                    1:1 채팅
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleAddChatRoom('GROUP')}
                                    className="block w-full border-t border-[#F0F0F0] bg-transparent px-[14px] py-[10px] text-left text-[14px] text-black"
                                >
                                    그룹 채팅
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowTypePopover(false);
                                        setShowInvitationDialog(true);
                                    }}
                                    className="block w-full border-t border-[#F0F0F0] bg-transparent px-[14px] py-[10px] text-left text-[14px] text-black"
                                >
                                    받은 초대
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            <ChoiceChipRow role="tablist" className="sticky top-[calc(var(--ara-safe-top)+56px)] z-30 bg-white">
                {TABS.map((t) => (
                    <ChoiceChip
                        key={t.label}
                        role="tab"
                        selected={t === tab}
                        // Native replaceState updates useSearchParams without router.replace's server round trip, so the chip flips on release.
                        onClick={() => t !== tab && window.history.replaceState(null, '', t.key ? `/web_view/Chat?tab=${t.key}` : '/web_view/Chat')}
                    >
                        {t.label}
                    </ChoiceChip>
                ))}
            </ChoiceChipRow>

            {/* 채팅방 목록 */}
            <div className="px-[15px] pb-24">
                {loaded && visibleRooms.length === 0 ? (
                    <div className="flex h-[50vh] flex-col items-center justify-center text-[#B1B1B1]">
                        <InformationIcon size={50} />
                        <span className="mt-2 text-[15px]">{tab.empty}</span>
                    </div>
                ) : (
                    visibleRooms.map((room) => {
                        // 미리보기 텍스트 조합
                        const lastMsg = room.recent_message;
                        const msgType = lastMsg?.message_type;

                        let preview = '';
                        if (msgType === 'IMAGE') {
                            preview = '이미지를 보냈습니다.';
                        } else if (msgType === 'FILE') {
                            preview = '파일을 보냈습니다.';
                        } else {
                            preview = lastMsg?.message_content ?? '';
                        }

                        const previewClamped = preview.length > 80 ? preview.slice(0, 80) + '…' : preview;

                        // 시간 표시 (HH:MM)
                        const timeSrc = room.recent_message_at || room.created_at || '';
                        const timeStr = timeSrc ? timeSrc.slice(11, 16) : '';

                        return (
                            <button
                                key={room.id}
                                type="button"
                                onClick={() => onRoomClick(room.id)}
                                className="flex w-full items-start border-b border-[#F0F0F0] px-[3px] py-3 text-left"
                            >
                                <div className="relative h-[42px] w-[42px] shrink-0">
                                    <Image
                                        src={room.picture || '/Chatroom_default1.png'}
                                        alt={room.room_title}
                                        fill
                                        className="rounded-full object-cover"
                                        sizes="42px"
                                    />
                                </div>
                                <div className="ml-3 min-w-0 flex-1">
                                    <div className="flex h-6 items-center">
                                        <div className="min-w-0 flex-1 truncate text-[16px] font-semibold">
                                            {room.room_title}
                                        </div>
                                        <div className="ml-2 shrink-0 text-[12px] text-[#B1B1B1]">
                                            {timeStr}
                                        </div>
                                    </div>
                                    <div className="flex h-[21px] items-center">
                                        <div className="min-w-0 flex-1 truncate text-[14px] text-[#B1B1B1]">
                                            {previewClamped || '새로운 채팅방'}
                                        </div>
                                    </div>
                                </div>
                            </button>
                        );
                    })
                )}
            </div>

            <UserSearchDialog
                open={showUserSearch}
                onClose={() => setShowUserSearch(false)}
                onSelectUser={handleSelectUser}
                title="새로운 1:1 채팅"
                actionText="채팅"
            />
            <RoomCreateDialog
                open={showRoomCreate}
                onClose={() => setShowRoomCreate(false)}
                onCreate={handleCreateGroupRoom}
            />
            <InvitationListDialog
                open={showInvitationDialog}
                onClose={() => setShowInvitationDialog(false)}
                onActionComplete={refreshRoomList}
            />
        </>
    );
}
