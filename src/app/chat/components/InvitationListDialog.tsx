'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { createPortal } from 'react-dom'; // React DOM에서 createPortal 임포트
import { fetchInvitationList, acceptInvitation, denyInvitation } from '@/lib/api/chat';

// API 응답에 따른 타입 정의
type Profile = {
    picture: string;
    nickname: string;
};

type RoomData = {
    room_title: string;
    picture: string;
};

type Invitation = {
    id: number;
    invitation_from_data: { profile: Profile };
    invited_room_data: RoomData;
};

type Props = {
    open: boolean;
    onClose: () => void;
    onActionComplete: () => void; // 수락 시 채팅방 목록 새로고침을 위함
};

export default function InvitationListDialog({ open, onClose, onActionComplete }: Props) {
    const [invitations, setInvitations] = useState<Invitation[]>([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState<number | null>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    useEffect(() => {
        if (open) {
            setLoading(true);
            fetchInvitationList()
                .then(data => {
                    setInvitations(data.results || []);
                })
                .catch(err => {
                    console.error("Failed to fetch invitations:", err);
                    alert("초대장 목록을 불러오는 데 실패했습니다.");
                })
                .finally(() => {
                    setLoading(false);
                });
        }
    }, [open]);

    const handleAccept = async (invitationId: number) => {
        if (submitting) return;
        setSubmitting(invitationId);
        try {
            await acceptInvitation(invitationId);
            alert("초대를 수락했습니다.");
            setInvitations(prev => prev.filter(inv => inv.id !== invitationId));
            onActionComplete();
        } catch (err) {
            alert("초대 수락에 실패했습니다.");
        } finally {
            setSubmitting(null);
        }
    };

    const handleDecline = async (invitationId: number) => {
        if (submitting) return;
        setSubmitting(invitationId);
        try {
            await denyInvitation(invitationId);
            alert("초대를 거절했습니다.");
            setInvitations(prev => prev.filter(inv => inv.id !== invitationId));
        } catch (err) {
            alert("초대 거절에 실패했습니다.");
        } finally {
            setSubmitting(null);
        }
    };

    if (!open || !mounted) return null;

    // 다이얼로그 내용을 정의
    const dialog = (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
            <div className="bg-white rounded-lg shadow-lg p-6 w-96 relative">
                <button
                    className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
                    onClick={onClose}
                >
                    ✕
                </button>
                <h3 className="text-lg font-bold mb-4">받은 초대 목록</h3>
                <div className="max-h-96 min-h-96 overflow-y-auto space-y-3">
                    {loading && <div className="text-gray-400 text-sm text-center py-4">불러오는 중...</div>}
                    {!loading && invitations.length === 0 && (
                        <div className="text-gray-400 text-sm text-center py-4">받은 초대가 없습니다.</div>
                    )}
                    {invitations.map(inv => (
                        <div key={inv.id} className="p-3 flex items-center justify-between">
                            <div className="flex items-center gap-3 min-w-0">
                                <Image
                                    src={inv.invited_room_data.picture}
                                    alt={inv.invited_room_data.room_title}
                                    width={40}
                                    height={40}
                                    className="rounded-full object-cover aspect-square"
                                />
                                <div className="min-w-0">
                                    <p className="text-base font-medium truncate" title={inv.invited_room_data.room_title}>
                                        {inv.invited_room_data.room_title}
                                    </p>
                                    <p className="text-xs text-gray-500 truncate">
                                        <span className="font-semibold">{inv.invitation_from_data.profile.nickname}</span>님의 초대
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-0 flex-shrink-0">
                                {/* 수락 버튼: 배경 없는 아이콘으로 변경 */}
                                <button
                                    onClick={() => handleAccept(inv.id)}
                                    disabled={!!submitting}
                                    className="w-8 h-8 flex items-center justify-center text-[#e15858] rounded-full hover:bg-red-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                    aria-label="초대 수락"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="20 6 9 17 4 12"></polyline>
                                    </svg>
                                </button>
                                {/* 거절 버튼: 배경 없는 아이콘으로 변경 */}
                                <button
                                    onClick={() => handleDecline(inv.id)}
                                    disabled={!!submitting}
                                    className="w-8 h-8 flex items-center justify-center text-black rounded-full hover:bg-gray-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                    aria-label="초대 거절"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="18" y1="6" x2="6" y2="18"></line>
                                        <line x1="6" y1="6" x2="18" y2="18"></line>
                                    </svg>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    // Portal을 사용하여 body에 직접 렌더링
    return createPortal(dialog, document.body);
}