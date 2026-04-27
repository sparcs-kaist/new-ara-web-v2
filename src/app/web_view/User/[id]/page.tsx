'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Screen, AppHeader } from '@/app/web_view/_components';
import { blockUser } from '@/lib/api/user';
import { fetchUserProfile, fetchUserPosts } from '@/lib/api/user_profile';

interface UserProfile {
    id: number;
    user?: number;
    nickname?: string;
    picture?: string | null;
    email?: string;
    sso_user_info?: { email?: string } | null;
}

interface PostRow {
    id: number;
    title: string;
    parent_board?: { ko_name?: string } | null;
}

export default function UserViewPage() {
    const router = useRouter();
    const params = useParams();
    const idParam = params?.id;
    const userId =
        typeof idParam === 'string'
            ? Number(idParam)
            : Array.isArray(idParam)
                ? Number(idParam[0])
                : NaN;

    const [user, setUser] = useState<UserProfile | null>(null);
    const [posts, setPosts] = useState<PostRow[]>([]);
    const [page, setPage] = useState(1);
    const [hasNext, setHasNext] = useState(false);
    const [loading, setLoading] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        if (!userId || isNaN(userId)) return;
        fetchUserProfile(userId)
            .then((data) => setUser(data))
            .catch((e) => console.warn('fetchUserProfile failed', e));
    }, [userId]);

    const loadPosts = useCallback(
        async (p: number) => {
            if (!userId || isNaN(userId)) return;
            setLoading(true);
            try {
                const data = await fetchUserPosts(userId, p);
                const results = (data?.results ?? []) as PostRow[];
                setPosts((prev) => (p === 1 ? results : [...prev, ...results]));
                setHasNext(Boolean(data?.next));
                setPage(p);
            } catch (e) {
                console.warn('fetchUserPosts failed', e);
            } finally {
                setLoading(false);
            }
        },
        [userId],
    );

    useEffect(() => {
        if (!userId || isNaN(userId)) return;
        loadPosts(1);
    }, [userId, loadPosts]);

    const onBlock = async () => {
        if (!userId || busy) return;
        setMenuOpen(false);
        if (!confirm('이 사용자를 차단하시겠어요?')) return;
        setBusy(true);
        try {
            await blockUser(userId);
            alert('차단했어요.');
            router.back();
        } catch (e) {
            console.warn('blockUser failed', e);
            alert('차단에 실패했어요.');
        } finally {
            setBusy(false);
        }
    };

    const onMessage = () => {
        setMenuOpen(false);
        // TODO: native 쪽지 기능 연결
        alert('쪽지 기능은 준비 중이에요.');
    };

    return (
        <Screen withTabBar={false}>
            <AppHeader
                title={user?.nickname ?? '프로필'}
                trailing={
                    <div style={{ position: 'relative' }}>
                        <button
                            type="button"
                            className="ara-header__btn"
                            onClick={() => setMenuOpen((v) => !v)}
                            aria-label="more"
                        >
                            <span style={{ fontSize: 22, fontWeight: 700 }}>⋯</span>
                        </button>
                        {menuOpen && (
                            <div
                                style={{
                                    position: 'absolute',
                                    right: 0,
                                    top: 36,
                                    background: 'var(--ara-bg)',
                                    border: '1px solid var(--ara-divider-strong)',
                                    borderRadius: 'var(--ara-radius-md)',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                                    minWidth: 120,
                                    overflow: 'hidden',
                                    zIndex: 60,
                                }}
                            >
                                <button
                                    type="button"
                                    onClick={onBlock}
                                    style={menuItemStyle}
                                >
                                    차단
                                </button>
                                <button
                                    type="button"
                                    onClick={onMessage}
                                    style={{ ...menuItemStyle, borderTop: '1px solid var(--ara-divider)' }}
                                >
                                    쪽지
                                </button>
                            </div>
                        )}
                    </div>
                }
            />

            <section
                className="ara-card"
                style={{
                    margin: 'var(--ara-spacing-lg)',
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
                        backgroundImage: user?.picture ? `url(${user.picture})` : undefined,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        flexShrink: 0,
                    }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 16, fontWeight: 700 }}>{user?.nickname ?? '...'}</div>
                </div>
            </section>

            <h2
                style={{
                    margin: '0 var(--ara-spacing-lg) var(--ara-spacing-sm)',
                    fontSize: 14,
                    fontWeight: 600,
                    color: 'var(--ara-text-secondary)',
                }}
            >
                작성한 글
            </h2>

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
                        padding: '40px 16px',
                        textAlign: 'center',
                        color: 'var(--ara-text-secondary)',
                        fontSize: 13,
                    }}
                >
                    작성한 글이 없어요.
                </div>
            )}

            {hasNext && (
                <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--ara-spacing-md)' }}>
                    <button
                        type="button"
                        onClick={() => loadPosts(page + 1)}
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
        </Screen>
    );
}

const menuItemStyle: React.CSSProperties = {
    display: 'block',
    width: '100%',
    padding: '10px 14px',
    background: 'transparent',
    border: 0,
    textAlign: 'left',
    fontSize: 13,
    color: 'var(--ara-text-primary)',
    cursor: 'pointer',
};
