'use client';

import { useEffect, useState } from 'react';
import { Screen, AppHeader } from '@/app/web_view/_components';
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
                <div style={{ padding: 'var(--ara-spacing-lg)' }}>
                    {[0, 1, 2].map((i) => (
                        <div
                            key={i}
                            className="ara-skeleton"
                            style={{ height: 48, marginBottom: 8 }}
                        />
                    ))}
                </div>
            ) : items.length === 0 ? (
                <div
                    style={{
                        padding: '60px 24px',
                        textAlign: 'center',
                        color: 'var(--ara-text-secondary)',
                        fontSize: 13,
                    }}
                >
                    차단된 사용자가 없어요.
                </div>
            ) : (
                <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                    {items.map((b) => (
                        <li
                            key={b.id}
                            className="ara-list-row"
                            style={{ cursor: 'default' }}
                        >
                            <span style={{ flex: 1, fontSize: 14 }}>{getBlockedName(b)}</span>
                            <button
                                type="button"
                                onClick={() => onUnblock(b.id)}
                                disabled={removing === b.id}
                                style={{
                                    padding: '6px 12px',
                                    borderRadius: 999,
                                    border: '1px solid var(--ara-divider-strong)',
                                    background: 'var(--ara-bg)',
                                    color: 'var(--ara-text-primary)',
                                    fontSize: 12,
                                    fontWeight: 600,
                                    cursor: removing === b.id ? 'default' : 'pointer',
                                }}
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
