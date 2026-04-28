'use client';

import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchArticles, fetchBoardList, fetchTopArticles } from '@/lib/api/board';
import { fetchPost } from '@/lib/api/post';
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

const KEY_BOARDS = ['webview', 'boards'] as const;
const KEY_TOP = (pageSize: number) => ['webview', 'articles', 'top', pageSize] as const;
const KEY_ARTICLES = (params: Record<string, unknown>) =>
    ['webview', 'articles', params] as const;
const KEY_POST = (postId: number) => ['webview', 'post', postId] as const;

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

export function usePost({ postId, fromView = 'all', current = 3, overrideHidden = true }: PostQueryArgs) {
    return useQuery({
        queryKey: KEY_POST(postId),
        queryFn: () => fetchPost({ postId, fromView, current, overrideHidden }),
        enabled: Number.isFinite(postId) && postId > 0,
    });
}

/** Imperative invalidation helper — wired to pull-to-refresh. */
export function useInvalidateAll() {
    const qc = useQueryClient();
    return useCallback(() => qc.invalidateQueries({ queryKey: ['webview'] }), [qc]);
}
