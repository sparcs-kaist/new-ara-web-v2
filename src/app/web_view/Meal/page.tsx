'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Screen } from '@/app/web_view/_components';
import { useDeliveryParties } from '@/app/web_view/_query';
import { usePullToRefresh } from '@/app/web_view/hooks/usePullToRefresh';
import { MainPageTextButton } from '@/app/web_view/Main/_components/MainPageTextButton';
import { DeliveryRoomCard, DeliveryRoomCardSkeleton } from '@/app/web_view/Delivery/_components/DeliveryRoomCard';
import { apiDetail } from '@/lib/api/delivery';
import { currentMealSlot, type MealSlot } from '@/lib/types/meal';
import { FacilityNotices } from './_components/FacilityNotices';
import { MenuPhotoStrip } from './_components/MenuPhotoStrip';

export default function MealHomePage() {
    const router = useRouter();
    const { data, isPending, isError, error } = useDeliveryParties({ page_size: 3 });
    const parties = data?.pages[0]?.results ?? [];
    // Set after mount: the page is prerendered at build time, so a render-time clock would be the build's.
    const [slot, setSlot] = useState<MealSlot | null>(null);
    useEffect(() => setSlot(currentMealSlot()), []);

    usePullToRefresh();

    return (
        <Screen>
            <header className="sticky top-[var(--ara-safe-top)] z-40 flex h-14 items-center bg-white px-5">
                <h1 className="text-[28px] font-bold text-ara_red">식사</h1>
            </header>

            <div className="px-5 pt-2">
                <button
                    type="button"
                    onClick={() => router.push(`/web_view/Meal/Menu?time=${encodeURIComponent((slot ?? currentMealSlot()).time)}`)}
                    className="relative flex h-[112px] w-full flex-col overflow-hidden rounded-[15px] bg-gradient-to-r from-[#FFF7F5] to-[#FFEDE8] px-5 pt-6 text-left"
                >
                    <span
                        aria-hidden
                        className="absolute right-[7px] top-[15px] h-[104px] w-[140px] origin-[70px_49px] rotate-[8deg] bg-[url('/webview/illust/meal_tray.svg')] bg-[length:100%_100%]"
                    />
                    <span className="relative block text-[11px] font-bold leading-[1.4] text-[#D9776E]">KAIST 학생식당</span>
                    <span className="relative mt-[3px] block text-[20px] font-bold leading-[1.4] text-[#333333]">오늘의 학식</span>
                    <span className="relative mt-[3px] block min-h-[17px] text-[12px] font-medium leading-[1.4] text-[#A8837F]">
                        {slot && `카이마루 · ${slot.time} ${slot.hours}`}
                    </span>
                </button>
            </div>

            <div className="mx-5 my-5 h-px bg-[#F0F0F0]" />

            <MenuPhotoStrip slot={slot} />

            <div className="mx-5 my-5 h-px bg-[#F0F0F0]" />

            <section>
                <MainPageTextButton label="함께 배달하기" onPress={() => router.push('/web_view/Delivery')} />
                <div className="mt-3 space-y-3 px-5">
                    {isPending ? (
                        [0, 1, 2].map((i) => <DeliveryRoomCardSkeleton key={i} />)
                    ) : parties.length === 0 ? (
                        <p className="py-3 text-center text-[14px] text-[#BBBBBB]">
                            {isError ? apiDetail(error) : '지금 모집 중인 함께 배달이 없어요'}
                        </p>
                    ) : (
                        <>
                            {parties.map((p) => (
                                <DeliveryRoomCard
                                    key={p.id}
                                    party={p}
                                    onPress={() => router.push(`/web_view/Delivery?party=${p.id}`)}
                                />
                            ))}
                            <button
                                type="button"
                                onClick={() => router.push('/web_view/Delivery')}
                                className="block w-full py-2 text-center text-[14px] text-[#BBBBBB]"
                            >
                                + 더보기
                            </button>
                        </>
                    )}
                </div>
            </section>

            <FacilityNotices />

            <div className="h-5" />
        </Screen>
    );
}
