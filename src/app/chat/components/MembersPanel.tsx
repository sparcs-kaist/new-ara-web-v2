/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React from 'react';
import Image from 'next/image';

// 참여자 타입 정의
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

interface MembersPanelProps {
    isOpen: boolean;
    onClose: () => void;
    members: Member[];
}

export default function MembersPanel({ isOpen, onClose, members }: MembersPanelProps) {
    return (
        <div className={`absolute inset-0 z-30 ${isOpen ? '' : 'pointer-events-none'}`}>
            <div
                className={`absolute inset-0 bg-black/20 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
                onClick={onClose}
            />
            <aside
                className={`absolute right-0 top-0 h-full w-[320px] bg-white shadow-xl border-l transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
                aria-label="참여자 목록"
            >
                <div className="flex items-center justify-between px-4 py-3 border-b">
                    <div className="font-semibold">멤버 : {members.length}명</div>
                    <button onClick={onClose} className="p-1 rounded hover:bg-gray-100" aria-label="닫기">
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
    );
}
