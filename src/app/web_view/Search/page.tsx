'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { fetchArticles } from '@/lib/api/board';
import type { ResponsePost } from '@/lib/types/post';
import { AppHeader, PostPreview, Screen, SearchIcon } from '@/app/web_view/_components';
import { fetchScopedArticles, readScope, scopeQuery, useScopeName } from '@/app/web_view/_query';
import { usePullToRefresh } from '@/app/web_view/hooks/usePullToRefresh';

function SearchInner() {
    const router = useRouter();
    const params = useSearchParams();
    const initialQ = params?.get('q') ?? '';
    const boardParam = params?.get('board');
    const boardId = boardParam ? Number.parseInt(boardParam, 10) : undefined;
    const scope = useMemo(() => readScope(params), [params]);
    const scopeName = useScopeName(scope);

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
                const data = scope
                    ? await fetchScopedArticles(scope, { query: trimmed, page: 1 })
                    : await fetchArticles({
                          query: trimmed,
                          boardId: Number.isFinite(boardId) ? boardId : undefined,
                          page: 1,
                      });
                setResults((data?.results ?? []) as ResponsePost[]);
            } catch (e) {
                console.warn('search failed', e);
                setError('검색에 실패했습니다.');
                setResults([]);
            } finally {
                setLoading(false);
            }
        },
        [boardId, scope],
    );

    useEffect(() => {
        setDraft(initialQ);
        setSubmittedQ(initialQ);
        if (initialQ) runSearch(initialQ);
        else setResults([]);
    }, [initialQ, runSearch]);

    usePullToRefresh(async () => {
        if (submittedQ) await runSearch(submittedQ);
    });

    const submit = () => {
        const q = draft.trim();
        setSubmittedQ(q);
        const next = new URLSearchParams();
        if (q) next.set('q', q);
        for (const key of ['board', 'course_id', 'std_dept_id']) {
            const value = params?.get(key);
            if (value) next.set(key, value);
        }
        const search = next.toString();
        router.replace(`/web_view/Search${search ? `?${search}` : ''}`);
        runSearch(q);
    };

    return (
        <Screen withTabBar={false}>
            <AppHeader title={scopeName ?? '검색'} />

            <div className="sticky top-14 z-30 flex items-center gap-2 bg-white px-5 py-2">
                <div className="flex h-10 w-full items-center rounded-[10px] bg-[#F6F6F6] pl-[6px]">
                    <span className="inline-flex h-7 w-9 items-center justify-center text-[#9E9E9E]">
                        <SearchIcon size={20} />
                    </span>
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
                        placeholder={scope ? '글 제목 · 내용 검색' : '게시판, 게시글 및 댓글 검색'}
                        inputMode="search"
                        enterKeyHint="search"
                        autoCapitalize="none"
                        className="w-full bg-transparent text-[16px] font-medium text-black placeholder:font-medium placeholder:text-[#BBBBBB] focus:outline-none"
                    />
                </div>
            </div>

            {loading && (
                <div className="flex justify-center py-6 text-[12px] text-[#B1B1B1]">
                    검색 중...
                </div>
            )}

            {!loading && error && (
                <div className="px-6 py-16 text-center text-[14px] text-[#B1B1B1]">{error}</div>
            )}

            {!loading && !error && submittedQ && results.length === 0 && (
                <div className="px-6 py-16 text-center text-[14px] text-[#B1B1B1]">
                    검색 결과가 없습니다.
                </div>
            )}

            {!loading && !error && results.length > 0 && (
                <ul>
                    {results.map((post, idx) => (
                        <li key={post.id}>
                            <button
                                type="button"
                                onClick={() => router.push(`/web_view/Post/${post.id}${scope ? `?${scopeQuery(scope)}` : ''}`)}
                                className="block w-full rounded-none bg-transparent px-5 py-[11px] text-left"
                            >
                                <PostPreview post={post} />
                            </button>
                            {idx < results.length - 1 && (
                                <div className="mx-5 h-px bg-[#F0F0F0]" />
                            )}
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
