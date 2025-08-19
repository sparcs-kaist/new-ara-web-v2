'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
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

    if (!open) return null;

    return (
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
                        <div key={inv.id} className="p-3 border rounded-lg flex items-center justify-between">
                            <div className="flex items-center gap-3 min-w-0">
                                <Image
                                    src={inv.invited_room_data.picture}
                                    alt={inv.invited_room_data.room_title}
                                    width={40}
                                    height={40}
                                    className="rounded-full object-cover aspect-square"
                                />
                                <div className="min-w-0">
                                    <p className="text-sm font-medium truncate" title={inv.invited_room_data.room_title}>
                                        {inv.invited_room_data.room_title}
                                    </p>
                                    <p className="text-xs text-gray-500 truncate">
                                        <span className="font-semibold">{inv.invitation_from_data.profile.nickname}</span>님의 초대
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-2 flex-shrink-0">
                                <button
                                    onClick={() => handleAccept(inv.id)}
                                    disabled={!!submitting}
                                    className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition disabled:bg-gray-400"
                                >
                                    {submitting === inv.id ? '...' : '수락'}
                                </button>
                                <button
                                    onClick={() => handleDecline(inv.id)}
                                    disabled={!!submitting}
                                    className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition disabled:bg-gray-400"
                                >
                                    {submitting === inv.id ? '...' : '거절'}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}