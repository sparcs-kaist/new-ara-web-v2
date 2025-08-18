/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { searchUser } from '@/lib/api/user';

type User = {
    id: number;
    nickname: string;
};

type Props = {
    open: boolean;
    onClose: () => void;
    onSelectUser: (user: User) => Promise<void>; // Promise를 반환하도록 변경
    title: string;
    actionText: string;
};

export default function UserSearchDialog({ open, onClose, onSelectUser, title, actionText }: Props) {
    const [search, setSearch] = useState('');
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState<number | null>(null); // 제출 중인 사용자 ID

    useEffect(() => {
        if (!open) {
            setSearch('');
            setUsers([]);
            return;
        }
        setLoading(true);
        const timer = setTimeout(() => {
            searchUser(search)
                .then(data => {
                    setUsers(data.results || []);
                })
                .finally(() => setLoading(false));
        }, 300); // Debounce
        return () => clearTimeout(timer);
    }, [search, open]);

    const handleSelect = async (user: User) => {
        if (submitting) return;
        setSubmitting(user.id);
        try {
            await onSelectUser(user);
        } catch (e: any) {
            alert(e.message || '작업에 실패했습니다.');
        } finally {
            setSubmitting(null);
        }
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
            <div className="bg-white rounded-lg shadow-lg p-6 w-80 relative">
                <button
                    className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
                    onClick={onClose}
                >
                    ✕
                </button>
                <h3 className="text-lg font-bold mb-4">{title}</h3>
                <input
                    className="w-full border rounded px-3 py-2 mb-3"
                    placeholder="닉네임으로 검색"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
                <div className="max-h-64 min-h-64 overflow-y-auto no-scrollbar">
                    {loading && <div className="text-gray-400 text-sm text-center py-4">검색 중...</div>}
                    {!loading && users.length === 0 && (
                        <div className="text-gray-400 text-sm text-center py-4">검색 결과가 없습니다.</div>
                    )}
                    {users.map(user => (
                        <div key={user.user} className="relative group">
                            <div className="w-full flex items-center text-left px-2 py-2 rounded">
                                <Image
                                    src={user.picture}
                                    alt={user.nickname}
                                    width={32}
                                    height={32}
                                    className="rounded-full object-cover aspect-square mr-2"
                                />
                                <span>{user.nickname}</span>
                            </div>
                            <div
                                className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center
                                           opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto
                                           transition-all duration-300 translate-x-4 group-hover:translate-x-0"
                            >
                                <button
                                    className="flex items-center gap-2 px-3 py-1 bg-blue-600 text-white rounded-full shadow hover:bg-blue-700 transition disabled:bg-gray-400"
                                    onClick={() => handleSelect({ id: user.user, nickname: user.nickname })}
                                    disabled={submitting === user.user}
                                >
                                    <span>{submitting === user.user ? '처리중...' : actionText}</span>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}