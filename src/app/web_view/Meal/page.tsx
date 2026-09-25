'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Screen } from '@/app/web_view/_components';
import { useDeliveryParties } from '@/app/web_view/_query';
import { usePullToRefresh } from '@/app/web_view/hooks/usePullToRefresh';
import { MainPageTextButton } from '@/app/web_view/Main/_components/MainPageTextButton';
import { DeliveryRoomCard, DeliveryRoomCardSkeleton } from '@/app/web_view/Delivery/_components/DeliveryRoomCard';
import { apiDetail } from '@/lib/api/delivery';

function todayLabel(d: Date) {
    const h = d.getHours();
    const meal = h < 10 ? '아침' : h < 14 ? '점심' : '저녁';
    return `${d.getMonth() + 1}월 ${d.getDate()}일 · ${meal}`;
}

export default function MealHomePage() {
    const router = useRouter();
    const { data, isPending, isError, error } = useDeliveryParties({ page_size: 3 });
    const parties = data?.pages[0]?.results ?? [];
    // Set after mount: the page is prerendered at build time, so a render-time date would be the build date.
    const [today, setToday] = useState('');
    useEffect(() => setToday(todayLabel(new Date())), []);

    usePullToRefresh();

    return (
        <Screen>
            <header className="sticky top-[var(--ara-safe-top)] z-40 flex h-14 items-center bg-white px-5">
                <h1 className="text-[28px] font-bold text-ara_red">식사</h1>
            </header>

            <div className="px-5 pt-2">
                <button
                    type="button"
                    onClick={() => router.push('/web_view/Meal/Menu')}
                    className="block w-full rounded-[15px] bg-ara_red_most_bright p-4 text-left"
                >
                    <span className="block text-[12px] text-[#646464]">KAIST 학생식당</span>
                    <span className="mt-1 block text-[18px] font-semibold text-black">오늘의 학식</span>
                    <span className="mt-1 block min-h-[20px] text-[13px] leading-5 text-[#646464]">{today}</span>
                </button>
            </div>

            <div className="h-5" />

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

            <div className="h-5" />
        </Screen>
    );
}
