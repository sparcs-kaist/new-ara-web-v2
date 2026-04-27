'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Screen, AppHeader } from '@/app/web_view/_components';
import { fetchArticles, fetchBoardList } from '@/lib/api/board';
import type { ResponsePost } from '@/lib/types/post';
import { ArticleRow, ArticleRowSkeleton } from '../_components/ArticleRow';
import { Fab } from '../_components/Fab';
import { SearchIconButton } from '../_components/SearchTrigger';
import { PosterGrid } from './_components/PosterGrid';

interface BoardItem {
    id: number;
    slug: string;
    ko_name: string;
    en_name?: string;
    name_type?: number;
}

const POSTER_SLUGS = new Set(['poster', 'poster-general']);
const POSTER_BOARD_ID = 19;
const PAGE_SIZE = 20;

export default function BoardSlugPage() {
    const router = useRouter();
    const params = useParams<{ slug: string }>();
    const slug = params?.slug;

    const [board, setBoard] = useState<BoardItem | null>(null);
    const [posts, setPosts] = useState<ResponsePost[]>([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const [boardError, setBoardError] = useState(false);

    const isPoster = useMemo(
        () => !!board && (POSTER_SLUGS.has(board.slug) || board.id === POSTER_BOARD_ID),
        [board],
    );

    // Resolve slug -> board metadata.
    useEffect(() => {
        if (!slug) return;
        let cancelled = false;
        fetchBoardList()
            .then((res) => {
                const list: BoardItem[] = Array.isArray(res) ? res : (res?.results ?? []);
                const match = list.find((b) => b.slug === slug);
                if (cancelled) return;
                if (!match) {
                    setBoardError(true);
                    return;
                }
                setBoard(match);
            })
            .catch(() => {
                if (!cancelled) setBoardError(true);
            });
        return () => {
            cancelled = true;
        };
    }, [slug]);

    // Reset paging when the board changes.
    useEffect(() => {
        setPosts([]);
        setPage(1);
        setTotalPages(null);
    }, [board?.id]);

    // Fetch one page.
    const loadPage = useCallback(
        async (boardId: number, pageNum: number) => {
            setLoading(true);
            try {
                const res = await fetchArticles({
                    boardId,
                    page: pageNum,
                    pageSize: PAGE_SIZE,
                });
                const results: ResponsePost[] = res.results ?? [];
                setPosts((prev) => (pageNum === 1 ? results : [...prev, ...results]));
                setTotalPages(res.num_pages ?? 1);
            } catch {
                // swallow — keep what we have
            } finally {
                setLoading(false);
            }
        },
        [],
    );

    useEffect(() => {
        if (!board) return;
        loadPage(board.id, page);
    }, [board, page, loadPage]);

    // IntersectionObserver-driven infinite scroll.
    const sentinelRef = useRef<HTMLDivElement | null>(null);
    useEffect(() => {
        const node = sentinelRef.current;
        if (!node) return;
        if (loading) return;
        if (totalPages !== null && page >= totalPages) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries.some((e) => e.isIntersecting)) {
                    setPage((p) => p + 1);
                }
            },
            { rootMargin: '200px' },
        );
        observer.observe(node);
        return () => observer.disconnect();
    }, [loading, page, totalPages, posts.length]);

    if (boardError) {
        return (
            <Screen>
                <AppHeader title="게시판" />
                <div
                    style={{
                        padding: 'var(--ara-spacing-xl)',
                        textAlign: 'center',
                        color: 'var(--ara-text-tertiary)',
                    }}
                >
                    존재하지 않는 게시판입니다.
                </div>
            </Screen>
        );
    }

    return (
        <Screen>
            <AppHeader
                title={board?.ko_name ?? ''}
                trailing={
                    <SearchIconButton
                        onClick={() =>
                            router.push(
                                `/web_view/Search?board=${encodeURIComponent(slug ?? '')}`,
                            )
                        }
                    />
                }
            />

            {board === null && (
                <div>
                    {Array.from({ length: 6 }).map((_, i) => (
                        <ArticleRowSkeleton key={i} />
                    ))}
                </div>
            )}

            {board && isPoster && <PosterGrid posts={posts} />}

            {board && !isPoster && (
                <div>
                    {posts.map((post) => (
                        <ArticleRow key={post.id} post={post} />
                    ))}
                </div>
            )}

            {board && posts.length === 0 && !loading && (
                <div
                    style={{
                        padding: 'var(--ara-spacing-xl)',
                        textAlign: 'center',
                        color: 'var(--ara-text-tertiary)',
                    }}
                >
                    게시물이 없습니다.
                </div>
            )}

            {board && loading && (
                <div>
                    {Array.from({ length: 3 }).map((_, i) => (
                        <ArticleRowSkeleton key={`load-${i}`} />
                    ))}
                </div>
            )}

            {/* Sentinel for IntersectionObserver-driven pagination. */}
            <div ref={sentinelRef} aria-hidden style={{ height: 1 }} />

            {board && (
                <Fab
                    href={`/web_view/PostWrite?board=${board.id}`}
                    aboveTabBar={false}
                />
            )}
        </Screen>
    );
}
