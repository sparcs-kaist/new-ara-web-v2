'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AppHeader, Screen, SearchIcon, Spinner } from '@/app/web_view/_components';
import { useDeliveryParties, useDeliveryPenalty } from '@/app/web_view/_query';
import { usePullToRefresh } from '@/app/web_view/hooks/usePullToRefresh';
import { apiDetail } from '@/lib/api/delivery';
import { isPenaltyActive } from '@/lib/delivery';
import { CtaButton, FixedBottomBar } from './_components/BottomCta';
import { DeliveryDetailSheet } from './_components/DeliveryDetailSheet';
import { DeliveryRoomCard, DeliveryRoomCardSkeleton } from './_components/DeliveryRoomCard';

function DeliveryListInner() {
    const router = useRouter();
    // ?party=<id> deep link from the 식사 home cards opens that room's sheet.
    const linkedId = Number(useSearchParams().get('party')) || null;
    const [openId, setOpenId] = useState<number | null>(linkedId);
    const [draft, setDraft] = useState('');
    const [search, setSearch] = useState('');
    const sentinelRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const t = window.setTimeout(() => setSearch(draft.trim()), 300);
        return () => window.clearTimeout(t);
    }, [draft]);

    const { data, isPending, isError, error, hasNextPage, isFetchingNextPage, isFetchNextPageError, fetchNextPage } =
        useDeliveryParties({ search });
    const parties = data?.pages.flatMap((p) => p.results).filter((p, i, all) => all.findIndex((q) => q.id === p.id) === i) ?? [];
    const penalty = useDeliveryPenalty();

    usePullToRefresh();

    useEffect(() => {
        const el = sentinelRef.current;
        if (!el) return;
        const io = new IntersectionObserver(
            (entries) => {
                if (entries.some((e) => e.isIntersecting) && hasNextPage && !isFetchingNextPage && !isFetchNextPageError) {
                    fetchNextPage();
                }
            },
            { rootMargin: '200px' },
        );
        io.observe(el);
        return () => io.disconnect();
    }, [hasNextPage, isFetchingNextPage, isFetchNextPageError, fetchNextPage]);

    const closeSheet = () => {
        setOpenId(null);
        // Drop the deep link so coming back from the chat room does not reopen the sheet.
        if (linkedId) router.replace('/web_view/Delivery', { scroll: false });
    };

    const openCreate = () =>
        router.push(isPenaltyActive(penalty.data?.until) ? '/web_view/Delivery/Restricted' : '/web_view/Delivery/New');

    return (
        <Screen withTabBar={false}>
            <AppHeader title="함께 배달하기" />

            <div className="px-5 pb-3 pt-1">
                <label className="flex h-11 items-center rounded-[10px] bg-[#F6F6F6] pl-[6px]">
                    <span className="inline-flex h-7 w-9 items-center justify-center text-[#9E9E9E]">
                        <SearchIcon size={20} />
                    </span>
                    <input
                        type="search"
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') e.currentTarget.blur();
                        }}
                        placeholder="식당 또는 배달 장소 검색"
                        enterKeyHint="search"
                        className="w-full bg-transparent pr-3 text-[16px] font-medium text-black placeholder:font-medium placeholder:text-[#BBBBBB] focus:outline-none"
                    />
                </label>
            </div>

            <div className="flex flex-1 flex-col px-5">
                {isPending ? (
                    <div className="space-y-3">
                        {[0, 1, 2].map((i) => (
                            <DeliveryRoomCardSkeleton key={i} />
                        ))}
                    </div>
                ) : parties.length === 0 ? (
                    <div className="flex flex-1 flex-col items-center justify-center text-center">
                        {isError ? (
                            <p className="text-[14px] text-[#BBBBBB]">{apiDetail(error)}</p>
                        ) : search ? (
                            <p className="text-[16px] font-semibold text-black">검색 결과가 없어요</p>
                        ) : (
                            <>
                                <p className="text-[16px] font-semibold text-black">지금 모집 중인 함께 배달이 없어요</p>
                                <p className="mt-1 text-[14px] text-[#BBBBBB]">첫 방을 열어 보세요</p>
                            </>
                        )}
                    </div>
                ) : (
                    <ul className="space-y-3">
                        {parties.map((p) => (
                            <li key={p.id}>
                                <DeliveryRoomCard party={p} onPress={() => setOpenId(p.id)} />
                            </li>
                        ))}
                    </ul>
                )}
                <div ref={sentinelRef} aria-hidden className="h-px" />
                {isFetchingNextPage && (
                    <div className="flex justify-center py-3">
                        <Spinner size={22} />
                    </div>
                )}
            </div>
            <div aria-hidden className="h-[96px] shrink-0" />

            <FixedBottomBar>
                <CtaButton onClick={openCreate}>방 개설하기</CtaButton>
            </FixedBottomBar>

            <DeliveryDetailSheet partyId={openId} onClose={closeSheet} />
        </Screen>
    );
}

export default function DeliveryListPage() {
    return (
        <Suspense fallback={null}>
            <DeliveryListInner />
        </Suspense>
    );
}
