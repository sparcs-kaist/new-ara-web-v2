'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PostPreview, Screen, SettingIcon } from '@/app/web_view/_components';
import { fetchMe } from '@/lib/api/user';
import { fetchUserPosts } from '@/lib/api/user_profile';
import { fetchArchivedPosts, fetchRecentViewedPosts } from '@/lib/api/board';
import type { ResponsePost } from '@/lib/types/post';
import { usePullToRefresh } from '@/app/web_view/hooks/usePullToRefresh';

interface MeProfile {
    id?: number;
    user?: number;
    nickname?: string;
    picture?: string | null;
    email?: string;
    sso_user_info?: { email?: string; first_name?: string; last_name?: string } | null;
}

type TabKey = 'mine' | 'scrap' | 'recent';

const TABS: { key: TabKey; label: string }[] = [
    { key: 'mine', label: '작성한 글' },
    { key: 'scrap', label: '담아둔 글' },
    { key: 'recent', label: '최근 본 글' },
];

/**
 * Mirrors `lib/pages/user_page.dart`.
 *
 * - AppBar: nickname (28/w700 brand red) + setting cog (red 28).
 * - 60px user info row: 50x50 avatar, name (18/w700) + email (14/w500 #B1B1B1),
 *   "변경" link (14/w500 #646464).
 * - TabBar with three tabs, red underline + red label for the active tab.
 * - "총 N개의 글" header.
 * - PostPreview list separated by 1px hairlines.
 */
export default function MyInfoPage() {
    const router = useRouter();
    const [me, setMe] = useState<MeProfile | null>(null);
    const [tab, setTab] = useState<TabKey>('mine');
    const [posts, setPosts] = useState<ResponsePost[]>([]);
    const [total, setTotal] = useState(0);
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
                let data: { results?: ResponsePost[]; next?: string | null; count?: number; num_items?: number } = {};
                if (which === 'mine') {
                    if (!me) return;
                    const userId = (me.user ?? me.id) as number;
                    if (!userId) return;
                    data = await fetchUserPosts(userId, p);
                } else if (which === 'scrap') {
                    data = await fetchArchivedPosts({ page: p, pageSize: 20 });
                } else {
                    data = await fetchRecentViewedPosts({ page: p, pageSize: 20 });
                }
                const results = (data.results ?? []) as ResponsePost[];
                setPosts((prev) => (p === 1 ? results : [...prev, ...results]));
                setHasNext(Boolean(data.next));
                setPage(p);
                if (typeof data.num_items === 'number') setTotal(data.num_items);
                else if (typeof data.count === 'number') setTotal(data.count);
                else setTotal(results.length);
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
        setTotal(0);
        loadPosts(tab, 1);
    }, [tab, me, loadPosts]);

    usePullToRefresh(async () => {
        try {
            const fresh = await fetchMe();
            setMe(fresh);
        } catch (e) {
            console.warn('fetchMe (refresh) failed', e);
        }
        await loadPosts(tab, 1);
    });

    const fullName = [me?.sso_user_info?.first_name, me?.sso_user_info?.last_name]
        .filter(Boolean)
        .join(' ');
    const displayName = fullName || me?.nickname || '';
    const subtitle = me?.email ?? me?.sso_user_info?.email ?? '이메일 정보 없음';

    return (
        <Screen withTabBar="auto">
            <header className="sticky top-[var(--ara-safe-top)] z-40 flex h-14 items-center bg-white px-5">
                <h1 className="flex-1 text-[28px] font-bold text-ara_red">
                    {me?.nickname ?? ''}
                </h1>
                <button
                    type="button"
                    onClick={() => router.push('/web_view/MyInfo/Settings')}
                    aria-label="설정"
                    className="flex h-11 w-11 items-center justify-center text-ara_red"
                >
                    <SettingIcon size={28} />
                </button>
            </header>

            {/* User info row */}
            <div className="flex h-[60px] items-center px-5">
                <span
                    className="inline-flex h-[50px] w-[50px] shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#E5E5E5]"
                    aria-hidden
                >
                    {me?.picture && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={me.picture}
                            alt=""
                            className="h-full w-full object-cover"
                        />
                    )}
                </span>
                <div className="ml-[10px] flex min-w-0 flex-1 flex-col justify-center">
                    <div className="truncate text-[18px] font-bold text-black">{displayName}</div>
                    <div className="truncate text-[14px] font-medium text-[#B1B1B1]">{subtitle}</div>
                </div>
                <Link
                    href="/web_view/MyInfo/Edit"
                    className="ml-[30px] text-[14px] font-medium text-[#646464]"
                >
                    변경
                </Link>
            </div>

            <div className="h-[10px]" />

            {/* TabBar — 1px continuous divider across the bar with a 2px red
                indicator that sits above the divider on the active tab. */}
            <nav role="tablist" className="mx-5 grid grid-cols-3 border-b border-[#F0F0F0]">
                {TABS.map((t) => {
                    const active = tab === t.key;
                    return (
                        <button
                            key={t.key}
                            type="button"
                            role="tab"
                            aria-selected={active}
                            onClick={() => setTab(t.key)}
                            className={[
                                'flex h-[44px] items-center justify-center bg-transparent text-[15px] font-medium',
                                active
                                    ? '-mb-px border-b-2 border-ara_red text-ara_red'
                                    : 'text-[#B1B1B1]',
                            ].join(' ')}
                        >
                            {t.label}
                        </button>
                    );
                })}
            </nav>

            {/* Total count */}
            <div className="px-5 pt-[14px] text-[16px] font-bold text-[#B1B1B1]">
                총 {total}개의 글
            </div>

            <div className="h-[15px]" />

            {/* Post list */}
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
                    게시물이 없습니다.
                </div>
            )}

            {hasNext && (
                <div className="flex justify-center py-3">
                    <button
                        type="button"
                        onClick={() => loadPosts(tab, page + 1)}
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
