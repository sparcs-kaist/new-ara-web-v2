import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { searchUser } from '@/lib/api/user';

type Props = {
    open: boolean;
    onClose: () => void;
    onSelectUser: (user: { id: number; nickname: string }) => void;
};

export default function UserSearchDialog({ open, onClose, onSelectUser }: Props) {
    const [search, setSearch] = useState('');
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [activeUser, setActiveUser] = useState<number | null>(null);

    useEffect(() => {
        if (!open) return;
        setLoading(true);
        searchUser(search)
            .then(data => {
                setUsers(data.results || []);
            })
            .finally(() => setLoading(false));
    }, [search, open]);

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
                <h3 className="text-lg font-bold mb-4">프로필 검색</h3>
                <input
                    className="w-full border rounded px-3 py-2 mb-3"
                    placeholder="닉네임으로 검색"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
                <div className="max-h-64 min-h-64 overflow-y-auto">
                    {loading && <div className="text-gray-400 text-sm">검색 중...</div>}
                    {!loading && users.length === 0 && (
                        <div className="text-gray-400 text-sm">검색 결과 없음</div>
                    )}
                    {users.map(user => (
                        <div key={user.user} className="relative group">
                            <button
                                className="w-full flex items-center text-left px-2 py-2 rounded hover:bg-gray-100"
                            >
                                <Image
                                    src={user.picture}
                                    alt={user.nickname}
                                    width={32}
                                    height={32}
                                    className="rounded-full object-cover aspect-square mr-2"
                                />
                                <span>{user.nickname}</span>
                            </button>
                            <div
                                className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center
                                           opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto
                                           transition-all duration-300 translate-x-4 group-hover:translate-x-0"
                            >
                                <button
                                    className="flex items-center gap-2 px-3 py-1 bg-blue-600 text-white rounded-full shadow hover:bg-blue-700 transition"
                                    onClick={() => { onSelectUser({ id: user.user, nickname: user.nickname }); onClose(); }}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h8m0 0l-4-4m4 4l-4 4" />
                                    </svg>
                                    DM하기
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}