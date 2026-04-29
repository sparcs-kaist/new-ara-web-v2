'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    CommentIcon,
    InformationIcon,
    NotificationIcon,
    Screen,
    VerifiedIcon,
} from '@/app/web_view/_components';
import { fetchNotifications, readAllNotifications } from '@/lib/api/notification';
import { usePullToRefresh } from '@/app/web_view/hooks/usePullToRefresh';

interface NotificationItem {
    id: number;
    type: string;
    title: string;
    content: string;
    is_read: boolean;
    created_at: string;
    related_article?: { id: number; title?: string } | null;
    related?: { parent_article?: number | null } | null;
}

function getTargetArticleId(n: NotificationItem): number | null {
    if (n.related?.parent_article != null) return Number(n.related.parent_article);
    if (n.related_article?.id != null) return Number(n.related_article.id);
    return null;
}

/**
 * Mirrors `lib/pages/notification_page.dart`.
 *
 * - 28/w700 brand-red "알림" title in the AppBar (no shadow, no border).
 * - List of cards (radius 15, hairline #F0F0F0, soft shadow rgba(0,0,0,0.04))
 *   with a 40x40 round status badge on the left.
 * - Date headers between cards when the day changes.
 * - FAB (verified icon) to mark all as read; turns red when there are unread.
 */
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

    usePullToRefresh(async () => {
        setHasNext(true);
        await loadPage(1);
    });

    const hasUnread = items.some((it) => !it.is_read);

    const onReadAll = async () => {
        if (markingAll || !hasUnread) return;
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
            <header className="sticky top-0 z-40 flex h-14 items-center bg-white px-5">
                <h1 className="text-[28px] font-bold text-ara_red">알림</h1>
            </header>

            <div className="px-5 pb-24">
                {!loading && items.length === 0 ? (
                    <div className="flex h-[50vh] flex-col items-center justify-center text-[#B1B1B1]">
                        <InformationIcon size={50} />
                        <span className="mt-2 text-[15px]">알림이 없습니다.</span>
                    </div>
                ) : (
                    items.map((n, idx) => {
                        const prev = items[idx - 1];
                        const showDate = idx === 0 || !sameDay(prev?.created_at, n.created_at);
                        return (
                            <div key={n.id}>
                                {showDate && (
                                    <div className="flex h-[60px] items-center justify-center text-[14px] font-medium text-[#B1B1B1]">
                                        {formatDateHeader(n.created_at)}
                                    </div>
                                )}
                                <button
                                    type="button"
                                    onClick={() => onTap(n)}
                                    className="mb-[10px] flex w-full items-start gap-[10px] rounded-[15px] border border-[#F0F0F0] bg-white p-[14px] text-left"
                                >
                                    <span
                                        className={[
                                            'mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
                                            n.is_read ? 'bg-[#B1B1B1]' : 'bg-ara_red',
                                        ].join(' ')}
                                        aria-hidden
                                    >
                                        <span className="text-white">
                                            {n.type === 'default' ? (
                                                <NotificationIcon size={26} />
                                            ) : (
                                                <CommentIcon size={20} />
                                            )}
                                        </span>
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <div
                                            className={[
                                                'truncate text-[16px] font-bold',
                                                n.is_read ? 'text-[#B1B1B1]' : 'text-black',
                                            ].join(' ')}
                                        >
                                            새 댓글
                                        </div>
                                        <div className="truncate text-[14px] font-medium text-black">
                                            {n.content}
                                        </div>
                                        {n.related_article?.title && (
                                            <div className="truncate text-[12px] font-medium text-black">
                                                | 게시글: {n.related_article.title}
                                            </div>
                                        )}
                                    </div>
                                </button>
                            </div>
                        );
                    })
                )}

                {hasNext && items.length > 0 && (
                    <div className="flex justify-center py-3">
                        <button
                            type="button"
                            onClick={() => loadPage(page + 1)}
                            disabled={loading}
                            className="rounded-full border border-[#F0F0F0] bg-white px-5 py-2 text-[13px] text-black"
                        >
                            {loading ? '불러오는 중...' : '더 보기'}
                        </button>
                    </div>
                )}
            </div>

            {/* Mark-all-read FAB */}
            <button
                type="button"
                onClick={onReadAll}
                aria-label="모두 읽음"
                className={[
                    'fixed right-5 z-30 flex h-[56px] w-[56px] items-center justify-center rounded-full bg-white',
                    hasUnread ? 'text-ara_red' : 'text-[#B1B1B1]',
                ].join(' ')}
                style={{
                    bottom: 'calc(20px + 50px + var(--ara-safe-bottom))',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                }}
            >
                <VerifiedIcon size={32} />
            </button>
        </Screen>
    );
}

function sameDay(a?: string, b?: string): boolean {
    if (!a || !b) return false;
    const da = new Date(a);
    const db = new Date(b);
    return (
        da.getFullYear() === db.getFullYear() &&
        da.getMonth() === db.getMonth() &&
        da.getDate() === db.getDate()
    );
}

function formatDateHeader(iso: string): string {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    const today = new Date();
    if (
        d.getFullYear() === today.getFullYear() &&
        d.getMonth() === today.getMonth() &&
        d.getDate() === today.getDate()
    ) {
        return '오늘';
    }
    if (d.getFullYear() === today.getFullYear()) {
        return `${d.getMonth() + 1}월 ${d.getDate()}일`;
    }
    return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
}
