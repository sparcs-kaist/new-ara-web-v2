'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Screen, AppHeader, PostPreview, LeftChevronIcon, SearchIcon, PostIcon } from '@/app/web_view/_components';
import { useSafeBack } from '@/app/web_view/hooks/useSafeBack';
import {
    fetchArticles,
    fetchTopArticles,
    fetchArchivedPosts,
    fetchRecentViewedPosts,
    fetchBoardList,
} from '@/lib/api/board';
import type { ResponsePost } from '@/lib/types/post';

interface BoardItem {
    id: number;
    slug: string;
    ko_name: string;
    en_name?: string;
}

type SpecialKind = 'all' | 'top' | 'scraps' | 'recent';

const SPECIAL_LABEL: Record<SpecialKind, string> = {
    all: '전체보기',
    top: '인기글',
    scraps: '담아둔 글',
    recent: '최근 본 글',
};

/**
 * Mirrors `lib/pages/post_list_show_page.dart`: a list of `PostPreview`
 * rows separated by 1px hairlines, with the board name shown next to a
 * red back-arrow (the 200px-wide `leadingWidth` AppBar in Flutter).
 *
 * Recognises four pseudo-slugs that come from the Board home tab:
 * `_all`, `_top`, `_scraps`, `_recent`. Anything else is treated as a
 * real board slug and resolved against `fetchBoardList()`.
 */
export default function BoardSlugPage() {
    const router = useRouter();
    const onBack = useSafeBack();
    const params = useParams<{ slug: string }>();
    const rawSlug = decodeURIComponent(params.slug ?? '');
    const isSpecial = rawSlug.startsWith('_');
    const specialKind: SpecialKind | null = isSpecial ? (rawSlug.slice(1) as SpecialKind) : null;

    const [board, setBoard] = useState<BoardItem | null>(null);
    const [posts, setPosts] = useState<ResponsePost[]>([]);
    const [page, setPage] = useState(1);
    const [hasNext, setHasNext] = useState(true);
    const [loading, setLoading] = useState(false);
    const sentinelRef = useRef<HTMLDivElement | null>(null);

    // Resolve board metadata for non-special slugs.
    useEffect(() => {
        if (isSpecial) return;
        let cancelled = false;
        fetchBoardList()
            .then((res) => {
                const list: BoardItem[] = Array.isArray(res) ? res : (res?.results ?? []);
                if (cancelled) return;
                setBoard(list.find((b) => b.slug === rawSlug) ?? null);
            })
            .catch(() => {});
        return () => {
            cancelled = true;
        };
    }, [isSpecial, rawSlug]);

    const loadPage = useCallback(
        async (p: number) => {
            setLoading(true);
            try {
                let res: { results?: ResponsePost[]; next?: string | null } = {};
                if (specialKind === 'top') {
                    res = await fetchTopArticles({ page: p, pageSize: 20 });
                } else if (specialKind === 'scraps') {
                    res = await fetchArchivedPosts({ page: p, pageSize: 20 });
                } else if (specialKind === 'recent') {
                    res = await fetchRecentViewedPosts({ page: p, pageSize: 20 });
                } else if (specialKind === 'all') {
                    res = await fetchArticles({ page: p, pageSize: 20 });
                } else if (board) {
                    res = await fetchArticles({ boardId: board.id, page: p, pageSize: 20 });
                } else {
                    return;
                }
                const list = (res.results ?? []) as ResponsePost[];
                setPosts((prev) => (p === 1 ? list : [...prev, ...list]));
                setHasNext(Boolean(res.next));
                setPage(p);
            } catch (e) {
                console.warn('board page fetch failed', e);
            } finally {
                setLoading(false);
            }
        },
        [specialKind, board],
    );

    useEffect(() => {
        if (!isSpecial && !board) return; // wait for board metadata
        setPosts([]);
        setHasNext(true);
        setPage(1);
        loadPage(1);
    }, [board, isSpecial, loadPage]);

    // Infinite scroll via IntersectionObserver.
    useEffect(() => {
        const el = sentinelRef.current;
        if (!el) return;
        const io = new IntersectionObserver(
            (entries) => {
                if (entries.some((e) => e.isIntersecting) && hasNext && !loading) {
                    loadPage(page + 1);
                }
            },
            { rootMargin: '200px' },
        );
        io.observe(el);
        return () => io.disconnect();
    }, [page, hasNext, loading, loadPage]);

    const title = specialKind ? SPECIAL_LABEL[specialKind] : (board?.ko_name ?? '');

    // Faithful Flutter AppBar: red chevron + small red board name on the left.
    const leading = (
        <button
            type="button"
            onClick={onBack}
            className="flex items-center text-ara_red"
            aria-label="뒤로"
        >
            <LeftChevronIcon size={32} />
            <span className="ml-1 text-[17px] font-medium text-ara_red">{title}</span>
        </button>
    );

    return (
        <Screen withTabBar={false}>
            <AppHeader
                title={null}
                leading={leading}
                trailing={
                    <>
                        <button
                            type="button"
                            aria-label="글쓰기"
                            onClick={() =>
                                router.push(
                                    board
                                        ? `/web_view/PostWrite?board=${board.id}`
                                        : '/web_view/PostWrite',
                                )
                            }
                            className="flex h-11 w-11 items-center justify-center text-ara_red"
                        >
                            <PostIcon size={28} />
                        </button>
                        <button
                            type="button"
                            aria-label="검색"
                            onClick={() =>
                                router.push(
                                    board
                                        ? `/web_view/Search?board=${board.id}`
                                        : '/web_view/Search',
                                )
                            }
                            className="flex h-11 w-11 items-center justify-center text-ara_red"
                        >
                            <SearchIcon size={28} />
                        </button>
                    </>
                }
            />

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

            <div ref={sentinelRef} aria-hidden className="h-8" />
            {loading && (
                <div className="flex justify-center py-3 text-[12px] text-[#B1B1B1]">
                    불러오는 중...
                </div>
            )}
        </Screen>
    );
}
