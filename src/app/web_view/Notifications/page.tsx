'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Screen } from '@/app/web_view/_components';
import { fetchNotifications, readAllNotifications } from '@/lib/api/notification';

interface NotificationItem {
    id: number;
    type: string;
    title: string;
    content: string;
    is_read: boolean;
    created_at: string;
    related_article?: { id: number } | null;
    related?: { parent_article?: number | null } | null;
}

function relativeTime(iso: string): string {
    if (!iso) return '';
    const then = new Date(iso).getTime();
    if (isNaN(then)) return '';
    const diff = Math.max(0, Date.now() - then);
    const m = Math.floor(diff / 60000);
    if (m < 1) return '방금 전';
    if (m < 60) return `${m}분 전`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}시간 전`;
    const d = Math.floor(h / 24);
    if (d < 7) return `${d}일 전`;
    const w = Math.floor(d / 7);
    if (w < 4) return `${w}주 전`;
    const mo = Math.floor(d / 30);
    if (mo < 12) return `${mo}달 전`;
    const y = Math.floor(d / 365);
    return `${y}년 전`;
}

function getTargetArticleId(n: NotificationItem): number | null {
    if (n.related?.parent_article != null) return Number(n.related.parent_article);
    if (n.related_article?.id != null) return Number(n.related_article.id);
    return null;
}

export default function NotificationsPage() {
    const router = useRouter();
    const [items, setItems] = useState<NotificationItem[]>([]);
    const [page, setPage] = useState(1);
    const [hasNext, setHasNext] = useState(true);
    const [loading, setLoading] = useState(false);
    const [markingAll, setMarkingAll] = useState(false);

    const loadPage = useCallback(async (p: number) => {
        setLoading(true);
        try {
            const data = await fetchNotifications(p, 20);
            const results = (data?.results ?? []) as NotificationItem[];
            setItems((prev) => (p === 1 ? results : [...prev, ...results]));
            setHasNext(Boolean(data?.next));
            setPage(p);
        } catch (e) {
            console.warn('fetchNotifications failed', e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadPage(1);
    }, [loadPage]);

    const onReadAll = async () => {
        if (markingAll) return;
        setMarkingAll(true);
        try {
            await readAllNotifications();
            setItems((prev) => prev.map((it) => ({ ...it, is_read: true })));
        } catch (e) {
            console.warn('readAllNotifications failed', e);
        } finally {
            setMarkingAll(false);
        }
    };

    const onTap = (n: NotificationItem) => {
        const articleId = getTargetArticleId(n);
        if (articleId) router.push(`/web_view/Post/${articleId}`);
    };

    return (
        <Screen withTabBar="auto">
            <header
                style={{
                    display: 'flex',
                    alignItems: 'flex-end',
                    justifyContent: 'space-between',
                    padding: 'var(--ara-spacing-lg) var(--ara-spacing-xl) var(--ara-spacing-md)',
                }}
            >
                <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>알림</h1>
                <button
                    type="button"
                    onClick={onReadAll}
                    disabled={markingAll || items.length === 0}
                    style={{
                        background: 'transparent',
                        border: 0,
                        color: 'var(--ara-primary)',
                        fontSize: 14,
                        fontWeight: 600,
                        cursor: 'pointer',
                        padding: 4,
                    }}
                >
                    전체 읽음
                </button>
            </header>

            {!loading && items.length === 0 ? (
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '80px 24px',
                        color: 'var(--ara-text-secondary)',
                    }}
                >
                    새 알림이 없어요.
                </div>
            ) : (
                <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                    {items.map((n) => (
                        <li
                            key={n.id}
                            className="ara-list-row"
                            onClick={() => onTap(n)}
                            style={{ alignItems: 'flex-start', gap: 'var(--ara-spacing-sm)' }}
                        >
                            <span
                                aria-hidden
                                style={{
                                    width: 8,
                                    height: 8,
                                    borderRadius: 999,
                                    marginTop: 8,
                                    flexShrink: 0,
                                    background: n.is_read ? 'transparent' : 'var(--ara-primary)',
                                }}
                            />
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div
                                    style={{
                                        fontSize: 14,
                                        fontWeight: 600,
                                        color: 'var(--ara-text-primary)',
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                    }}
                                >
                                    {n.title}
                                </div>
                                <div
                                    style={{
                                        fontSize: 13,
                                        color: 'var(--ara-text-secondary)',
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        marginTop: 2,
                                    }}
                                >
                                    {n.content}
                                </div>
                            </div>
                            <span
                                style={{
                                    fontSize: 11,
                                    color: 'var(--ara-text-tertiary)',
                                    flexShrink: 0,
                                    marginLeft: 'var(--ara-spacing-sm)',
                                }}
                            >
                                {relativeTime(n.created_at)}
                            </span>
                        </li>
                    ))}
                </ul>
            )}

            {hasNext && items.length > 0 && (
                <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--ara-spacing-lg)' }}>
                    <button
                        type="button"
                        onClick={() => loadPage(page + 1)}
                        disabled={loading}
                        style={{
                            padding: '10px 20px',
                            borderRadius: 'var(--ara-radius-md)',
                            border: '1px solid var(--ara-divider-strong)',
                            background: 'var(--ara-bg)',
                            color: 'var(--ara-text-primary)',
                            fontSize: 13,
                            fontWeight: 500,
                            cursor: loading ? 'default' : 'pointer',
                        }}
                    >
                        {loading ? '불러오는 중...' : '더 보기'}
                    </button>
                </div>
            )}

            {loading && items.length === 0 && (
                <div style={{ padding: 'var(--ara-spacing-lg)' }}>
                    {[0, 1, 2, 3].map((i) => (
                        <div
                            key={i}
                            className="ara-skeleton"
                            style={{ height: 56, marginBottom: 8 }}
                        />
                    ))}
                </div>
            )}
        </Screen>
    );
}
