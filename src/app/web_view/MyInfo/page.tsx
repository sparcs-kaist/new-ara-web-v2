'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Screen } from '@/app/web_view/_components';
import { fetchMe } from '@/lib/api/user';
import { fetchUserPosts } from '@/lib/api/user_profile';
import { fetchArchivedPosts, fetchRecentViewedPosts } from '@/lib/api/board';

interface MeProfile {
    id: number;
    user?: number;
    nickname?: string;
    picture?: string | null;
    email?: string;
    sso_user_info?: { email?: string; kaist_info?: string } | null;
}

interface PostRow {
    id: number;
    title: string;
    parent_board?: { ko_name?: string; slug?: string } | null;
    created_at?: string;
}

type TabKey = 'mine' | 'scrap' | 'recent';

const TABS: { key: TabKey; label: string }[] = [
    { key: 'mine', label: '내가 쓴 글' },
    { key: 'scrap', label: '스크랩한 글' },
    { key: 'recent', label: '최근 본 글' },
];

export default function MyInfoPage() {
    const router = useRouter();
    const [me, setMe] = useState<MeProfile | null>(null);
    const [tab, setTab] = useState<TabKey>('mine');
    const [posts, setPosts] = useState<PostRow[]>([]);
    const [page, setPage] = useState(1);
    const [hasNext, setHasNext] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchMe()
            .then((data) => setMe(data))
            .catch((e) => console.warn('fetchMe failed', e));
    }, []);

    const loadPosts = useCallback(
        async (which: TabKey, p: number) => {
            setLoading(true);
            try {
                let data: { results?: PostRow[]; next?: string | null } = {};
                if (which === 'mine') {
                    if (!me?.user && !me?.id) return;
                    const userId = (me?.user ?? me?.id) as number;
                    data = await fetchUserPosts(userId, p);
                } else if (which === 'scrap') {
                    data = await fetchArchivedPosts({ page: p, pageSize: 20 });
                } else {
                    data = await fetchRecentViewedPosts({ page: p, pageSize: 20 });
                }
                const results = (data.results ?? []) as PostRow[];
                setPosts((prev) => (p === 1 ? results : [...prev, ...results]));
                setHasNext(Boolean(data.next));
                setPage(p);
            } catch (e) {
                console.warn('loadPosts failed', e);
            } finally {
                setLoading(false);
            }
        },
        [me],
    );

    useEffect(() => {
        if (tab === 'mine' && !me) return;
        setPosts([]);
        setHasNext(false);
        loadPosts(tab, 1);
    }, [tab, me, loadPosts]);

    const displayName = me?.nickname ?? '익명';
    const subtitle = me?.email ?? me?.sso_user_info?.email ?? '';
    const avatar = me?.picture;

    return (
        <Screen withTabBar="auto">
            <header style={{ padding: 'var(--ara-spacing-lg) var(--ara-spacing-xl) var(--ara-spacing-md)' }}>
                <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>내 정보</h1>
            </header>

            <section
                className="ara-card"
                style={{
                    margin: '0 var(--ara-spacing-lg) var(--ara-spacing-lg)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--ara-spacing-lg)',
                }}
            >
                <div
                    style={{
                        width: 56,
                        height: 56,
                        borderRadius: 999,
                        background: 'var(--ara-bg-muted)',
                        backgroundImage: avatar ? `url(${avatar})` : undefined,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        flexShrink: 0,
                    }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--ara-text-primary)' }}>
                        {displayName}
                    </div>
                    {subtitle && (
                        <div
                            style={{
                                fontSize: 12,
                                color: 'var(--ara-text-secondary)',
                                marginTop: 2,
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                            }}
                        >
                            {subtitle}
                        </div>
                    )}
                </div>
                <Link
                    href="/web_view/MyInfo/Edit"
                    style={{
                        fontSize: 12,
                        fontWeight: 600,
                        padding: '6px 12px',
                        borderRadius: 999,
                        border: '1px solid var(--ara-divider-strong)',
                        color: 'var(--ara-text-primary)',
                        textDecoration: 'none',
                        flexShrink: 0,
                    }}
                >
                    프로필 수정
                </Link>
            </section>

            <nav
                role="tablist"
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    margin: '0 var(--ara-spacing-lg) var(--ara-spacing-md)',
                    background: 'var(--ara-bg-muted)',
                    borderRadius: 'var(--ara-radius-md)',
                    padding: 4,
                    gap: 4,
                }}
            >
                {TABS.map((t) => {
                    const active = tab === t.key;
                    return (
                        <button
                            key={t.key}
                            type="button"
                            role="tab"
                            aria-selected={active}
                            onClick={() => setTab(t.key)}
                            style={{
                                padding: '8px 4px',
                                borderRadius: 'var(--ara-radius-sm)',
                                border: 0,
                                fontSize: 13,
                                fontWeight: active ? 700 : 500,
                                color: active ? 'var(--ara-text-primary)' : 'var(--ara-text-secondary)',
                                background: active ? 'var(--ara-bg)' : 'transparent',
                                cursor: 'pointer',
                                boxShadow: active ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                            }}
                        >
                            {t.label}
                        </button>
                    );
                })}
            </nav>

            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                {posts.map((p) => (
                    <li
                        key={p.id}
                        className="ara-list-row"
                        onClick={() => router.push(`/web_view/Post/${p.id}`)}
                    >
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div
                                style={{
                                    fontSize: 14,
                                    fontWeight: 500,
                                    color: 'var(--ara-text-primary)',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                }}
                            >
                                {p.title}
                            </div>
                            {p.parent_board?.ko_name && (
                                <div
                                    style={{
                                        fontSize: 11,
                                        color: 'var(--ara-text-tertiary)',
                                        marginTop: 2,
                                    }}
                                >
                                    {p.parent_board.ko_name}
                                </div>
                            )}
                        </div>
                    </li>
                ))}
            </ul>

            {!loading && posts.length === 0 && (
                <div
                    style={{
                        textAlign: 'center',
                        color: 'var(--ara-text-secondary)',
                        padding: '40px 16px',
                        fontSize: 13,
                    }}
                >
                    아직 게시글이 없어요.
                </div>
            )}

            {hasNext && (
                <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--ara-spacing-md)' }}>
                    <button
                        type="button"
                        onClick={() => loadPosts(tab, page + 1)}
                        disabled={loading}
                        style={{
                            padding: '8px 18px',
                            borderRadius: 'var(--ara-radius-md)',
                            border: '1px solid var(--ara-divider-strong)',
                            background: 'var(--ara-bg)',
                            color: 'var(--ara-text-primary)',
                            fontSize: 13,
                            cursor: loading ? 'default' : 'pointer',
                        }}
                    >
                        {loading ? '불러오는 중...' : '더 보기'}
                    </button>
                </div>
            )}

            <div
                className="ara-list-row"
                onClick={() => router.push('/web_view/MyInfo/Settings')}
                style={{ marginTop: 'var(--ara-spacing-lg)', borderTop: '1px solid var(--ara-divider)' }}
            >
                <span style={{ flex: 1, fontSize: 14, fontWeight: 500 }}>설정</span>
                <span style={{ color: 'var(--ara-text-tertiary)', fontSize: 18 }}>›</span>
            </div>
        </Screen>
    );
}
