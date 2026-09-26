'use client';

import { useCallback, useState } from 'react';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { fetchCourseArticles, fetchMajorArticles } from '@/lib/api/board';
import { addUserMajor, fetchCourseTerms, fetchMajors, fetchMyMajors, removeUserMajor } from '@/lib/api/campus';
import { fetchCourses } from '@/lib/api/user';
import type { ResponsePost } from '@/lib/types/post';

export const CAMPUS_KEY = ['webview', 'campus'] as const;
export const COURSE_TERMS_KEY = [...CAMPUS_KEY, 'terms'] as const;
export const coursesKey = (year?: number, semester?: number) => [...CAMPUS_KEY, 'courses', year, semester] as const;
export const MY_MAJORS_KEY = [...CAMPUS_KEY, 'my-majors'] as const;
export const MAJORS_KEY = [...CAMPUS_KEY, 'majors'] as const;

const TERM_STORAGE_KEY = 'ara.campus.term';
const SEASON_LABELS = ['봄', '여름', '가을', '겨울'];

export interface CourseTerm {
    year: number;
    semester: number;
}

export const seasonLabel = (semester: number) => SEASON_LABELS[semester - 1] ?? `${semester}학기`;
export const termLabel = (term: CourseTerm) => `${term.year}년도 ${seasonLabel(term.semester)}`;
export const sameTerm = (a: CourseTerm, b: CourseTerm) => a.year === b.year && a.semester === b.semester;

export function readStoredTerm(): CourseTerm | null {
    try {
        const parsed = JSON.parse(localStorage.getItem(TERM_STORAGE_KEY) ?? 'null');
        return typeof parsed?.year === 'number' && typeof parsed?.semester === 'number' ? { year: parsed.year, semester: parsed.semester } : null;
    } catch {
        return null;
    }
}

function storeTerm(term: CourseTerm) {
    try {
        localStorage.setItem(TERM_STORAGE_KEY, JSON.stringify(term));
    } catch {
        // Storage can be unavailable in private mode; the pick then lasts for the page only.
    }
}

export function useCourseTerms() {
    return useQuery({
        queryKey: COURSE_TERMS_KEY,
        queryFn: fetchCourseTerms,
        select: (terms) => [...terms].sort((a, b) => b.year - a.year || b.semester - a.semester),
        staleTime: 60 * 60_000,
    });
}

// The stored term wins while it is still one of the user's terms; otherwise the newest.
export function useCampusTerm() {
    const { data: terms, isPending, isError, error } = useCourseTerms();
    const [picked, setPicked] = useState<CourseTerm | null>(readStoredTerm);
    const term = (picked && terms?.find((t) => sameTerm(t, picked))) || terms?.[0] || null;
    const selectTerm = useCallback((next: CourseTerm) => {
        setPicked(next);
        storeTerm(next);
    }, []);
    return { terms, term, selectTerm, isPending, isError, error };
}

export function useCourses(year?: number, semester?: number) {
    return useQuery({
        queryKey: coursesKey(year, semester),
        queryFn: (): Promise<Course[]> => fetchCourses(year, semester),
        enabled: year !== undefined,
        staleTime: 60 * 60_000,
    });
}

export function useMyMajors() {
    return useQuery({
        queryKey: MY_MAJORS_KEY,
        queryFn: fetchMyMajors,
        staleTime: 5 * 60_000,
    });
}

export function useMajors(enabled = true) {
    return useQuery({
        queryKey: MAJORS_KEY,
        queryFn: fetchMajors,
        select: (majors) => [...majors].sort((a, b) => a.major_name.localeCompare(b.major_name, 'ko')),
        enabled,
        staleTime: 5 * 60_000,
    });
}

export interface MajorChange {
    stdDeptId: number;
    add: boolean;
}

// One request per change; the first failure is reported after every request has settled.
export function useUserMajorMutation() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (changes: MajorChange[]) => {
            const results = await Promise.allSettled(changes.map(({ stdDeptId, add }) => (add ? addUserMajor(stdDeptId) : removeUserMajor(stdDeptId))));
            const failed = results.find((r): r is PromiseRejectedResult => r.status === 'rejected');
            if (failed) throw failed.reason;
        },
        onSettled: () => Promise.all([qc.invalidateQueries({ queryKey: MY_MAJORS_KEY }), qc.invalidateQueries({ queryKey: MAJORS_KEY })]),
    });
}

// Exactly one side is set; assignable to the API's ArticleScope.
export type BoardScope = { courseId: number; stdDeptId?: undefined } | { stdDeptId: number; courseId?: undefined };

export function readScope(params: { get(name: string): string | null } | null): BoardScope | undefined {
    const courseId = Number(params?.get('course_id'));
    if (courseId > 0) return { courseId };
    const stdDeptId = Number(params?.get('std_dept_id'));
    if (stdDeptId > 0) return { stdDeptId };
    return undefined;
}

export const scopeQuery = (scope: BoardScope) => (scope.courseId != null ? `course_id=${scope.courseId}` : `std_dept_id=${scope.stdDeptId}`);

export const SCOPED_ARTICLES_KEY = [...CAMPUS_KEY, 'articles'] as const;
const scopedArticlesKey = (scope: BoardScope) =>
    scope.courseId != null ? [...SCOPED_ARTICLES_KEY, 'course', scope.courseId] : [...SCOPED_ARTICLES_KEY, 'major', scope.stdDeptId];

const ARTICLE_PAGE_SIZE = 20;

interface ArticlePage {
    results?: ResponsePost[];
    next?: string | null;
}

export function fetchScopedArticles(scope: BoardScope, params: { page?: number; query?: string }): Promise<ArticlePage> {
    return scope.courseId != null
        ? fetchCourseArticles({ courseId: scope.courseId, pageSize: ARTICLE_PAGE_SIZE, ...params })
        : fetchMajorArticles({ stdDeptId: scope.stdDeptId, pageSize: ARTICLE_PAGE_SIZE, ...params });
}

// The client default never refetches on mount; a board list must pick up new posts on re-entry.
export function useScopedArticles(scope: BoardScope) {
    return useInfiniteQuery({
        queryKey: scopedArticlesKey(scope),
        queryFn: ({ pageParam }) => fetchScopedArticles(scope, { page: pageParam }),
        initialPageParam: 1,
        getNextPageParam: (last, pages) => (last.next ? pages.length + 1 : undefined),
        staleTime: 0,
        refetchOnMount: true,
        retry: false,
    });
}

// The stored term first, then the unfiltered list (deep link or another term).
export function useCourse(id: number) {
    const { term, isPending: termsPending } = useCampusTerm();
    const inTerm = useCourses(term?.year, term?.semester);
    const fromTerm = inTerm.data?.find((c) => c.id === id);
    const needAll = !fromTerm && !termsPending && (!term || !inTerm.isPending);
    const all = useQuery({
        queryKey: coursesKey(),
        queryFn: (): Promise<Course[]> => fetchCourses(),
        enabled: needAll,
        staleTime: 60 * 60_000,
    });
    const course = fromTerm ?? all.data?.find((c) => c.id === id) ?? null;
    return { course, isPending: !course && !all.isSuccess && !all.isError };
}

export function useMajor(stdDeptId: number) {
    const mine = useMyMajors();
    const fromMine = mine.data?.find((m) => m.std_dept_id === stdDeptId);
    const all = useMajors(!fromMine && !mine.isPending);
    const major = fromMine ?? all.data?.find((m) => m.std_dept_id === stdDeptId) ?? null;
    return { major, isPending: !major && !all.isSuccess && !all.isError };
}

export function findCachedCourse(qc: QueryClient, id: number) {
    for (const [, data] of qc.getQueriesData<Course[]>({ queryKey: [...CAMPUS_KEY, 'courses'] })) {
        const hit = data?.find((c) => c.id === id);
        if (hit) return hit;
    }
    return undefined;
}

export function findCachedMajor(qc: QueryClient, stdDeptId: number) {
    for (const key of [MY_MAJORS_KEY, MAJORS_KEY]) {
        const hit = qc.getQueryData<Major[]>(key)?.find((m) => m.std_dept_id === stdDeptId);
        if (hit) return hit;
    }
    return undefined;
}

// Read from the cache the board page filled; a deep link falls back to the generic label.
export function useScopeName(scope: BoardScope | undefined) {
    const qc = useQueryClient();
    if (!scope) return null;
    if (scope.courseId != null) return findCachedCourse(qc, scope.courseId)?.title ?? '수업 게시판';
    return findCachedMajor(qc, scope.stdDeptId)?.major_name ?? '학과 게시판';
}
