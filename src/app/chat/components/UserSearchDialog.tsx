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
                    className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
                    onClick={onClose}
                >
                    ✕
                </button>
                <h3 className="text-lg font-bold mb-4">유저 검색</h3>
                <input
                    className="w-full border rounded px-3 py-2 mb-3"
                    placeholder="닉네임으로 검색"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
                <div>
                    {loading && <div className="text-gray-400 text-sm">검색 중...</div>}
                    {!loading && users.length === 0 && (
                        <div className="text-gray-400 text-sm">검색 결과 없음</div>
                    )}
                    {users.map(user => (
                        <button
                            key={user.user}
                            className="w-full flex items-center text-left px-2 py-2 rounded hover:bg-gray-100"
                            onClick={() => { onSelectUser({ id: user.user, nickname: user.nickname }); onClose(); }}
                        >
                            <Image
                                src={user.picture}
                                alt={user.nickname}
                                width={28}
                                height={28}
                                className="rounded-full object-cover mr-2"
                            />
                            <span>{user.nickname}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}