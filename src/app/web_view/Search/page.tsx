'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { fetchArticles } from '@/lib/api/board';
import type { ResponsePost } from '@/lib/types/post';
import { Screen, AppHeader } from '@/app/web_view/_components';
import { bridge } from '@/app/web_view/_bridge';
import { formatDate } from '@/app/post/util/formatDate';

function SearchInner() {
    const router = useRouter();
    const params = useSearchParams();
    const initialQ = params?.get('q') ?? '';
    const boardParam = params?.get('board');
    const boardId = boardParam ? Number.parseInt(boardParam, 10) : undefined;

    const [draft, setDraft] = useState(initialQ);
    const [submittedQ, setSubmittedQ] = useState(initialQ);
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<ResponsePost[]>([]);
    const [error, setError] = useState<string | null>(null);

    const runSearch = useCallback(
        async (q: string) => {
            const trimmed = q.trim();
            if (!trimmed) {
                setResults([]);
                setError(null);
                return;
            }
            setLoading(true);
            setError(null);
            try {
                const data = await fetchArticles({
                    query: trimmed,
                    boardId: Number.isFinite(boardId) ? boardId : undefined,
                    page: 1,
                });
                setResults((data?.results ?? []) as ResponsePost[]);
            } catch (e) {
                console.error('search failed', e);
                setError('검색에 실패했습니다.');
                setResults([]);
            } finally {
                setLoading(false);
            }
        },
        [boardId],
    );

    // Sync draft and run on URL change.
    useEffect(() => {
        setDraft(initialQ);
        setSubmittedQ(initialQ);
        if (initialQ) runSearch(initialQ);
        else setResults([]);
    }, [initialQ, runSearch]);

    const submit = () => {
        try {
            bridge?.send('haptic', { kind: 'light' });
        } catch {
            /* noop */
        }
        const q = draft.trim();
        setSubmittedQ(q);
        // Push so back button returns to a previous query.
        const next = new URLSearchParams();
        if (q) next.set('q', q);
        if (boardParam) next.set('board', boardParam);
        const search = next.toString();
        router.replace(`/web_view/Search${search ? `?${search}` : ''}`);
        runSearch(q);
    };

    return (
        <Screen withTabBar={false}>
            <AppHeader title="검색" />

            <div
                style={{
                    position: 'sticky',
                    top: 'var(--ara-header-height)',
                    zIndex: 30,
                    background: 'var(--ara-bg)',
                    borderBottom: '1px solid var(--ara-divider)',
                    padding: '8px var(--ara-spacing-lg)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                }}
            >
                <input
                    type="search"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            submit();
                        }
                    }}
                    placeholder="검색어를 입력하세요"
                    inputMode="search"
                    enterKeyHint="search"
                    autoCapitalize="none"
                    style={{
                        flex: 1,
                        height: 36,
                        padding: '0 12px',
                        borderRadius: 18,
                        border: '1px solid var(--ara-divider-strong)',
                        background: 'var(--ara-bg-muted)',
                        fontSize: 14,
                        color: 'var(--ara-text-primary)',
                        outline: 'none',
                    }}
                />
                <button
                    type="button"
                    onClick={submit}
                    aria-label="search"
                    style={{
                        flexShrink: 0,
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        border: 0,
                        background: 'var(--ara-primary)',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                    }}
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                        <circle cx="11" cy="11" r="6" stroke="currentColor" strokeWidth="2" />
                        <path d="M16 16L20 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                </button>
            </div>

            {loading && (
                <div style={{ padding: 16 }}>
                    <div className="ara-skeleton" style={{ width: '100%', height: 56, marginBottom: 8 }} />
                    <div className="ara-skeleton" style={{ width: '100%', height: 56, marginBottom: 8 }} />
                    <div className="ara-skeleton" style={{ width: '100%', height: 56 }} />
                </div>
            )}

            {!loading && error && (
                <div style={{ padding: 24, textAlign: 'center', color: 'var(--ara-text-tertiary)' }}>
                    {error}
                </div>
            )}

            {!loading && !error && submittedQ && results.length === 0 && (
                <div
                    style={{
                        padding: 48,
                        textAlign: 'center',
                        color: 'var(--ara-text-tertiary)',
                        fontSize: 14,
                    }}
                >
                    검색 결과가 없습니다.
                </div>
            )}

            {!loading && !error && results.length > 0 && (
                <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                    {results.map((post) => (
                        <li
                            key={post.id}
                            className="ara-list-row"
                            onClick={() => router.push(`/web_view/Post/${post.id}`)}
                            style={{ flexDirection: 'column', alignItems: 'stretch', gap: 4 }}
                        >
                            <div
                                style={{
                                    fontSize: 12,
                                    color: 'var(--ara-text-tertiary)',
                                    display: 'flex',
                                    gap: 6,
                                    alignItems: 'center',
                                }}
                            >
                                {post.parent_board?.ko_name && <span>{post.parent_board.ko_name}</span>}
                                {post.parent_topic?.ko_name && (
                                    <>
                                        <span aria-hidden>·</span>
                                        <span style={{ color: 'var(--ara-primary)' }}>
                                            [{post.parent_topic.ko_name}]
                                        </span>
                                    </>
                                )}
                            </div>
                            <div
                                style={{
                                    fontSize: 15,
                                    fontWeight: 500,
                                    color: 'var(--ara-text-primary)',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                }}
                            >
                                {post.title}
                            </div>
                            <div
                                style={{
                                    fontSize: 12,
                                    color: 'var(--ara-text-tertiary)',
                                    display: 'flex',
                                    gap: 8,
                                }}
                            >
                                <span>{post.created_by?.profile?.nickname ?? ''}</span>
                                <span aria-hidden>·</span>
                                <span>{post.created_at ? formatDate(post.created_at) : ''}</span>
                                <span aria-hidden>·</span>
                                <span>댓글 {post.comment_count ?? 0}</span>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </Screen>
    );
}

export default function WebViewSearchPage() {
    return (
        <Suspense fallback={null}>
            <SearchInner />
        </Suspense>
    );
}
