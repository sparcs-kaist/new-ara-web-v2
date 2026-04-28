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
const SPECIAL_KINDS = new Set<SpecialKind>(['all', 'top', 'scraps', 'recent']);

const SPECIAL_LABEL: Record<SpecialKind, string> = {
    all: '전체보기',
    top: '인기글',
    scraps: '담아둔 글',
    recent: '최근 본 글',
};

/**
 * Mirrors `lib/pages/post_list_show_page.dart`. The dynamic segment is
 * the numeric board id — slugs drift between environments so an id-based
 * route avoids 404s that would otherwise bounce the user out of the
 * WebView. The four pseudo-segments (`_all`, `_top`, `_scraps`, `_recent`)
 * keep their underscore-prefixed form so they don't collide with ids.
 */
export default function BoardIdPage() {
    const router = useRouter();
    const onBack = useSafeBack();
    const params = useParams<{ id: string }>();
    const rawId = decodeURIComponent(params.id ?? '');
    const isSpecial = rawId.startsWith('_');
    const specialCandidate = isSpecial ? rawId.slice(1) : null;
    const specialKind: SpecialKind | null =
        specialCandidate && SPECIAL_KINDS.has(specialCandidate as SpecialKind)
            ? (specialCandidate as SpecialKind)
            : null;
    const numericBoardId = isSpecial ? null : Number.parseInt(rawId, 10);
    const hasValidId = numericBoardId !== null && Number.isFinite(numericBoardId) && numericBoardId > 0;

    // Unrecognised pseudo-slug like "_foo" — treat the same as a missing route.
    useEffect(() => {
        if (isSpecial && !specialKind) router.replace('/web_view/Main');
    }, [isSpecial, specialKind, router]);

    const [board, setBoard] = useState<BoardItem | null>(null);
    const [boardResolved, setBoardResolved] = useState(false);
    const [posts, setPosts] = useState<ResponsePost[]>([]);
    const [page, setPage] = useState(1);
    const [hasNext, setHasNext] = useState(true);
    const [loading, setLoading] = useState(false);
    const sentinelRef = useRef<HTMLDivElement | null>(null);

    // Resolve board metadata for non-special ids. Unknown ids bounce back
    // to /web_view/Main rather than rendering an empty list.
    useEffect(() => {
        if (isSpecial) return;
        if (!hasValidId) {
            router.replace('/web_view/Main');
            return;
        }
        let cancelled = false;
        fetchBoardList()
            .then((res) => {
                const list: BoardItem[] = Array.isArray(res) ? res : (res?.results ?? []);
                if (cancelled) return;
                const found = list.find((b) => b.id === numericBoardId) ?? null;
                if (!found) {
                    router.replace('/web_view/Main');
                    return;
                }
                setBoard(found);
                setBoardResolved(true);
            })
            .catch(() => {
                if (!cancelled) router.replace('/web_view/Main');
            });
        return () => {
            cancelled = true;
        };
    }, [isSpecial, hasValidId, numericBoardId, router]);

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
        if (!isSpecial && !boardResolved) return; // wait for board metadata
        setPosts([]);
        setHasNext(true);
        setPage(1);
        loadPage(1);
    }, [boardResolved, isSpecial, loadPage]);

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
