'use client';

import { useCallback } from 'react';
import { useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { fetchArticles, fetchBoardList, fetchTopArticles } from '@/lib/api/board';
import { fetchPost } from '@/lib/api/post';
import { fetchMe } from '@/lib/api/user';
import type { ResponsePost } from '@/lib/types/post';

/**
 * WebView-scoped query hooks. They are intentionally separate from the
 * desktop hooks in `src/lib/api/*` and `src/lib/query/*` so changes to
 * caching/keys/staleTime here can't reach the desktop tree.
 *
 * Naming convention: every key starts with `'webview'` — even though we
 * have a separate QueryClient, the prefix keeps things obvious in
 * devtools and prevents collisions if anything is ever shared.
 */

interface BoardItem {
    id: number;
    slug: string;
    ko_name: string;
    en_name?: string;
    group?: { id: number; slug: string; ko_name: string } | null;
    topics?: Array<{ id: number; slug: string; ko_name: string }>;
}

const KEY_ME = ['webview', 'me'] as const;
const KEY_BOARDS = ['webview', 'boards'] as const;
const KEY_TOP = (pageSize: number) => ['webview', 'articles', 'top', pageSize] as const;
const KEY_ARTICLES = (params: Record<string, unknown>) =>
    ['webview', 'articles', params] as const;
const KEY_POST = (postId: number) => ['webview', 'post', postId] as const;

/**
 * Auth probe. Returns the current user (or throws on 401, which Main
 * page treats as the trigger to redirect to /web_view/Login). Cached
 * for the session — there's no point re-firing this on every back-nav.
 */
export function useMe() {
    return useQuery({
        queryKey: KEY_ME,
        queryFn: () => fetchMe(),
        staleTime: 10 * 60_000,
        gcTime: 60 * 60_000,
        retry: false,
    });
}

export function useBoardList() {
    return useQuery({
        queryKey: KEY_BOARDS,
        queryFn: async () => {
            const res = await fetchBoardList();
            const list: BoardItem[] = Array.isArray(res) ? res : (res?.results ?? []);
            return list;
        },
        // Boards rarely change — let it sit in cache for the whole session.
        staleTime: 10 * 60_000,
    });
}

export function useTopArticles(pageSize = 3) {
    return useQuery({
        queryKey: KEY_TOP(pageSize),
        queryFn: async () => {
            const res = await fetchTopArticles({ pageSize });
            return (res?.results ?? []) as ResponsePost[];
        },
    });
}

interface BoardSectionParams {
    boardId?: number;
    topicId?: number;
    pageSize?: number;
    enabled?: boolean;
}

export function useBoardSection({
    boardId,
    topicId,
    pageSize = 3,
    enabled = true,
}: BoardSectionParams) {
    return useQuery({
        queryKey: KEY_ARTICLES({ boardId, topicId, pageSize }),
        queryFn: async () => {
            if (!boardId) return [] as ResponsePost[];
            const res = await fetchArticles({ boardId, topicId, pageSize });
            return (res?.results ?? []) as ResponsePost[];
        },
        enabled: enabled && !!boardId,
    });
}

interface PostQueryArgs {
    postId: number;
    fromView?: string;
    current?: number;
    overrideHidden?: boolean;
}

/**
 * Walk every cached `['webview', 'articles', ...]` list and the top
 * articles cache for an entry whose id matches. Returns the first hit
 * — used as placeholderData for `usePost` so navigating from a list
 * shows the title/board/author immediately while the body loads.
 */
function findCachedPost(qc: QueryClient, postId: number): ResponsePost | undefined {
    const lists = qc.getQueriesData<ResponsePost[]>({ queryKey: ['webview', 'articles'] });
    for (const [, data] of lists) {
        if (!Array.isArray(data)) continue;
        const hit = data.find((p) => p?.id === postId);
        if (hit) return hit;
    }
    return undefined;
}

export function usePost({ postId, fromView = 'all', current = 3, overrideHidden = true }: PostQueryArgs) {
    const qc = useQueryClient();
    return useQuery({
        queryKey: KEY_POST(postId),
        queryFn: () => fetchPost({ postId, fromView, current, overrideHidden }),
        enabled: Number.isFinite(postId) && postId > 0,
        placeholderData: () => findCachedPost(qc, postId),
    });
}

/** Imperative invalidation helper — wired to pull-to-refresh. */
export function useInvalidateAll() {
    const qc = useQueryClient();
    return useCallback(() => qc.invalidateQueries({ queryKey: ['webview'] }), [qc]);
}
