'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    AppHeader,
    MoreIcon,
    PostPreview,
    Screen,
} from '@/app/web_view/_components';
import { useSafeBack } from '@/app/web_view/hooks/useSafeBack';
import { usePullToRefresh } from '@/app/web_view/hooks/usePullToRefresh';
import { blockUser } from '@/lib/api/user';
import { fetchUserProfile, fetchUserPosts } from '@/lib/api/user_profile';
import type { ResponsePost } from '@/lib/types/post';

interface UserProfile {
    id: number;
    user?: number;
    nickname?: string;
    picture?: string | null;
    email?: string;
    sso_user_info?: { email?: string } | null;
}

/**
 * Mirrors `lib/pages/user_view_page.dart` — view another user's profile and
 * the list of articles they've written. The trailing kebab opens a tiny
 * popover with 차단 / 쪽지 actions.
 */
export default function UserViewPage() {
    const router = useRouter();
    const onBack = useSafeBack();
    const params = useParams();
    const idParam = params?.id;
    const userId =
        typeof idParam === 'string'
            ? Number(idParam)
            : Array.isArray(idParam)
              ? Number(idParam[0])
              : NaN;

    const [user, setUser] = useState<UserProfile | null>(null);
    const [posts, setPosts] = useState<ResponsePost[]>([]);
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
                const results = (data?.results ?? []) as ResponsePost[];
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

    usePullToRefresh(async () => {
        if (!userId || isNaN(userId)) return;
        try {
            const fresh = await fetchUserProfile(userId);
            setUser(fresh);
        } catch (e) {
            console.warn('fetchUserProfile (refresh) failed', e);
        }
        setHasNext(false);
        await loadPosts(1);
    });

    const onBlock = async () => {
        if (!userId || busy) return;
        setMenuOpen(false);
        if (typeof window !== 'undefined' && !window.confirm('이 사용자를 차단하시겠어요?'))
            return;
        setBusy(true);
        try {
            await blockUser(userId);
            if (typeof window !== 'undefined') window.alert('차단했어요.');
            onBack();
        } catch (e) {
            console.warn('blockUser failed', e);
            if (typeof window !== 'undefined') window.alert('차단에 실패했어요.');
        } finally {
            setBusy(false);
        }
    };

    const onMessage = () => {
        setMenuOpen(false);
        if (typeof window !== 'undefined') window.alert('쪽지 기능은 준비 중이에요.');
    };

    return (
        <Screen withTabBar={false}>
            <AppHeader
                title={user?.nickname ?? ''}
                trailing={
                    <div className="relative">
                        <button
                            type="button"
                            onClick={() => setMenuOpen((v) => !v)}
                            aria-label="더보기"
                            className="flex h-11 w-11 items-center justify-center bg-transparent text-black"
                        >
                            <MoreIcon size={20} />
                        </button>
                        {menuOpen && (
                            <div
                                role="menu"
                                className="absolute right-0 top-full z-50 mt-1 min-w-[120px] overflow-hidden rounded-[10px] border border-[#F0F0F0] bg-white"
                            >
                                <button
                                    type="button"
                                    onClick={onBlock}
                                    className="block w-full bg-transparent px-[14px] py-[10px] text-left text-[14px] text-black"
                                >
                                    차단
                                </button>
                                <button
                                    type="button"
                                    onClick={onMessage}
                                    className="block w-full border-t border-[#F0F0F0] bg-transparent px-[14px] py-[10px] text-left text-[14px] text-black"
                                >
                                    쪽지
                                </button>
                            </div>
                        )}
                    </div>
                }
            />

            {/* Profile card (no shadow). */}
            <section className="flex h-[60px] items-center px-5">
                <span
                    className="inline-flex h-[50px] w-[50px] shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#E5E5E5]"
                    aria-hidden
                >
                    {user?.picture && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={user.picture}
                            alt=""
                            className="h-full w-full object-cover"
                        />
                    )}
                </span>
                <div className="ml-[10px] flex min-w-0 flex-1 flex-col justify-center">
                    <div className="truncate text-[18px] font-bold text-black">
                        {user?.nickname ?? ''}
                    </div>
                </div>
            </section>

            <div className="mx-5 mt-2 h-px bg-[#F0F0F0]" />

            <h2 className="px-5 py-[15px] text-[16px] font-bold text-black">작성한 글</h2>

            <ul className="px-5">
                {posts.map((p, idx) => (
                    <li key={p.id}>
                        <button
                            type="button"
                            onClick={() => router.push(`/web_view/Post/${p.id}`)}
                            className="block w-full bg-transparent py-[11px] text-left"
                        >
                            <PostPreview post={p} />
                        </button>
                        {idx < posts.length - 1 && <div className="h-px bg-[#F0F0F0]" />}
                    </li>
                ))}
            </ul>

            {!loading && posts.length === 0 && (
                <div className="px-6 py-16 text-center text-[14px] text-[#B1B1B1]">
                    작성한 글이 없습니다.
                </div>
            )}

            {hasNext && (
                <div className="flex justify-center py-3">
                    <button
                        type="button"
                        onClick={() => loadPosts(page + 1)}
                        disabled={loading}
                        className="rounded-full border border-[#F0F0F0] bg-white px-5 py-2 text-[13px] text-black"
                    >
                        {loading ? '불러오는 중...' : '더 보기'}
                    </button>
                </div>
            )}
        </Screen>
    );
}
