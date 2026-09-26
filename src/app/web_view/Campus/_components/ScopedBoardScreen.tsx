'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { AppHeader, CenteredSpinner, ModifyIcon, NotificationIcon, PostPreview, Screen, SearchIcon, Skeleton, Spinner } from '@/app/web_view/_components';
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

    const forbidden = isError && errorStatus(error) === 403;

    return (
        <Screen>
            <AppHeader
                title={<span className="text-[18px] font-bold tracking-[0.9px] text-ara_red">{label}</span>}
                onBack={onBack}
                trailing={
                    <>
                        <button
                            type="button"
                            aria-label="알림"
                            onClick={() => router.push('/web_view/Notifications')}
                            className="flex h-11 w-11 items-center justify-center rounded-full text-ara_red"
                        >
                            <NotificationIcon size={35} />
                        </button>
                        <button
                            type="button"
                            aria-label="검색"
                            onClick={() => router.push(`/web_view/Search?${query}`)}
                            className="flex h-11 w-11 items-center justify-center rounded-full text-ara_red"
                        >
                            <SearchIcon size={35} />
                        </button>
                    </>
                }
            />

            <div className="px-5 pb-3 pt-4">
                {pending ? (
                    <>
                        <Skeleton className="h-[26px] w-[60%] rounded" />
                        <Skeleton className="mt-[18px] h-[17px] w-[40%] rounded" />
                    </>
                ) : (
                    <>
                        <h2 className="text-[22px] font-extrabold leading-[26px] tracking-[-0.22px] text-black">{title}</h2>
                        {lines.length > 0 && (
                            <div className="mt-[18px]">
                                {lines.map((line, i) => (
                                    <p key={i} className="whitespace-pre-wrap text-[14px] font-medium leading-[17px] tracking-[-0.14px] text-[#808080]">
                                        {line}
                                    </p>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>

            {isError && posts.length === 0 ? (
                <div className="flex flex-1 flex-col items-center justify-center pb-20 text-center">
                    <p className="text-[16px] font-bold text-[#222222]">{forbidden ? forbiddenMessage : apiDetail(error)}</p>
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

            {canWrite && !forbidden && (
                <button
                    type="button"
                    aria-label="글쓰기"
                    data-press="strong"
                    onClick={() => router.push(`/web_view/PostWrite?${query}`)}
                    className="fixed z-40 flex h-[60px] w-[60px] items-center justify-center rounded-full bg-ara_red text-white shadow-[0_4px_8px_rgba(0,0,0,0.15)]"
                    style={{ right: 'calc(20px + var(--ara-safe-right))', bottom: 'calc(70px + var(--ara-safe-bottom))' }}
                >
                    <ModifyIcon size={42} />
                </button>
            )}
        </Screen>
    );
}
