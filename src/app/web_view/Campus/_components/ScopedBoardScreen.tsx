'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { AppHeader, CenteredSpinner, LeftChevronIcon, PostIcon, PostPreview, Screen, SearchIcon, Skeleton, Spinner } from '@/app/web_view/_components';
import { useSafeBack } from '@/app/web_view/hooks/useSafeBack';
import { scopeQuery, useScopedArticles, type BoardScope } from '@/app/web_view/_query';
import { apiDetail } from '@/lib/api/delivery';
import { errorStatus } from '@/lib/api/store';

interface ScopedBoardScreenProps {
    label: string;
    title: string | null;
    lines: string[];
    pending: boolean;
    scope: BoardScope;
    canWrite: boolean;
    forbiddenMessage: string;
}

export function ScopedBoardScreen({ label, title, lines, pending, scope, canWrite, forbiddenMessage }: ScopedBoardScreenProps) {
    const router = useRouter();
    const onBack = useSafeBack();
    const { data, error, isPending, isError, isFetching, hasNextPage, fetchNextPage } = useScopedArticles(scope);
    const sentinelRef = useRef<HTMLDivElement | null>(null);
    const posts = data?.pages.flatMap((p) => p.results ?? []) ?? [];
    const query = scopeQuery(scope);

    useEffect(() => {
        const el = sentinelRef.current;
        if (!el) return;
        const io = new IntersectionObserver(
            (entries) => {
                if (entries.some((e) => e.isIntersecting) && hasNextPage && !isFetching && !isError) fetchNextPage();
            },
            { rootMargin: '200px' },
        );
        io.observe(el);
        return () => io.disconnect();
    }, [hasNextPage, isFetching, isError, fetchNextPage]);

    const leading = (
        <button type="button" onClick={onBack} className="flex items-center text-ara_red" aria-label="뒤로">
            <LeftChevronIcon size={32} />
            <span className="ml-1 text-[17px] font-medium text-ara_red">{label}</span>
        </button>
    );

    return (
        <Screen>
            <AppHeader
                title={null}
                leading={leading}
                trailing={
                    <>
                        {canWrite && (
                            <button
                                type="button"
                                aria-label="글쓰기"
                                onClick={() => router.push(`/web_view/PostWrite?${query}`)}
                                className="flex h-11 w-11 items-center justify-center rounded-full text-ara_red"
                            >
                                <PostIcon size={28} />
                            </button>
                        )}
                        <button
                            type="button"
                            aria-label="검색"
                            onClick={() => router.push(`/web_view/Search?${query}`)}
                            className="flex h-11 w-11 items-center justify-center rounded-full text-ara_red"
                        >
                            <SearchIcon size={28} />
                        </button>
                    </>
                }
            />

            <div className="px-5 pb-4 pt-4">
                {pending ? (
                    <>
                        <Skeleton className="h-[26px] w-[60%] rounded" />
                        <Skeleton className="mt-2 h-[14px] w-[40%] rounded" />
                    </>
                ) : (
                    <>
                        <h2 className="text-[22px] font-bold leading-[28px] text-[#222222]">{title}</h2>
                        {lines.map((line, i) => (
                            <p key={i} className="mt-1 text-[13px] text-[#646464]">
                                {line}
                            </p>
                        ))}
                    </>
                )}
            </div>
            <div className="mx-5 h-px bg-[#F0F0F0]" />

            {isError && posts.length === 0 ? (
                <div className="flex flex-1 flex-col items-center justify-center pb-20 text-center">
                    <p className="text-[16px] font-bold text-[#222222]">{errorStatus(error) === 403 ? forbiddenMessage : apiDetail(error)}</p>
                    <button type="button" onClick={onBack} className="mt-5 h-[44px] rounded-[10px] bg-[#F6F6F6] px-6 text-[15px] font-medium text-[#646464]">
                        돌아가기
                    </button>
                </div>
            ) : (
                <>
                    <ul>
                        {posts.map((p, idx) => (
                            <li key={p.id}>
                                <button
                                    type="button"
                                    onClick={() => router.push(`/web_view/Post/${p.id}?${query}`)}
                                    className="block w-full rounded-none bg-transparent px-5 py-[11px] text-left"
                                >
                                    <PostPreview post={p} />
                                </button>
                                {idx < posts.length - 1 && <div className="mx-5 h-px bg-[#F0F0F0]" />}
                            </li>
                        ))}
                    </ul>

                    {!isPending && posts.length === 0 && <div className="px-6 py-16 text-center text-[14px] text-[#B1B1B1]">게시물이 없습니다.</div>}

                    <div ref={sentinelRef} aria-hidden className="h-8" />
                    {isPending ? (
                        <CenteredSpinner padY={48} />
                    ) : isFetching ? (
                        <div className="flex justify-center py-3">
                            <Spinner size={22} />
                        </div>
                    ) : null}
                </>
            )}
        </Screen>
    );
}
