'use client';

import { useEffect, useState } from 'react';
import { AppHeader, Screen } from '@/app/web_view/_components';
import { deleteBlock, fetchBlocks } from '@/lib/api/user';

interface BlockItem {
    id: number;
    blocked_nickname?: string;
    user?: { nickname?: string } | null;
    blocked?: { nickname?: string } | null;
}

function getBlockedName(b: BlockItem): string {
    return (
        b.blocked_nickname ?? b.blocked?.nickname ?? b.user?.nickname ?? '알 수 없음'
    );
}

export default function BlockedUsersPage() {
    const [items, setItems] = useState<BlockItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [removing, setRemoving] = useState<number | null>(null);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            setLoading(true);
            try {
                const data = await fetchBlocks();
                if (cancelled) return;
                const list = Array.isArray(data) ? data : (data?.results ?? []);
                setItems(list as BlockItem[]);
            } catch (e) {
                console.warn('fetchBlocks failed', e);
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    const onUnblock = async (id: number) => {
        if (removing != null) return;
        setRemoving(id);
        try {
            await deleteBlock(id);
            setItems((prev) => prev.filter((b) => b.id !== id));
        } catch (e) {
            console.warn('deleteBlock failed', e);
        } finally {
            setRemoving(null);
        }
    };

    return (
        <Screen withTabBar={false}>
            <AppHeader title="차단된 사용자" />

            {loading ? (
                <div className="flex justify-center py-6 text-[12px] text-[#B1B1B1]">
                    불러오는 중...
                </div>
            ) : items.length === 0 ? (
                <div className="px-6 py-16 text-center text-[14px] text-[#B1B1B1]">
                    차단된 사용자가 없습니다.
                </div>
            ) : (
                <ul className="px-5">
                    {items.map((b) => (
                        <li
                            key={b.id}
                            className="flex h-[50px] items-center border-b border-[#F0F0F0]"
                        >
                            <span className="flex-1 text-[14px] text-black">
                                {getBlockedName(b)}
                            </span>
                            <button
                                type="button"
                                onClick={() => onUnblock(b.id)}
                                disabled={removing === b.id}
                                className="rounded-full border border-[#F0F0F0] bg-white px-3 py-1 text-[12px] font-medium text-[#646464] disabled:text-[#B1B1B1]"
                            >
                                {removing === b.id ? '처리 중...' : '차단 해제'}
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </Screen>
    );
}
