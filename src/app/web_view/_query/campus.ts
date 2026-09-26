'use client';

import { useCallback, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { addUserMajor, fetchCourseTerms, fetchMajors, fetchMyMajors, removeUserMajor } from '@/lib/api/campus';
import { fetchCourses } from '@/lib/api/user';

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
