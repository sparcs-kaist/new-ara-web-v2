'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { AppHeader, CameraIcon, Screen, Skeleton } from '@/app/web_view/_components';
import { useMealPhotos, useRestaurants } from '@/app/web_view/_query';
import { usePullToRefresh } from '@/app/web_view/hooks/usePullToRefresh';
import { CtaButton, FixedBottomBar } from '@/app/web_view/Delivery/_components/BottomCta';
import { currentMealSlot, defaultRestaurant, displayRestaurantName, formatMealDate, timeStringToMealType } from '@/lib/types/meal';
import { MealSegment, OfficialBadge, PhotoCover, PhotoLabel } from '../_components/photoParts';
import { PhotoViewer, type ViewerState } from '../_components/PhotoViewer';
import { UploadPhotoSheet } from '../_components/UploadPhotoSheet';

function MealPhotosInner() {
    const restaurants = useRestaurants();
    const linked = Number(useSearchParams().get('restaurant'));
    const linkedId = restaurants.find(({ id }) => id === linked)?.id;
    // Client-only under the useSearchParams boundary, so this is the device clock.
    const [today] = useState(() => new Date());
    const date = formatMealDate(today);
    const [meal, setMeal] = useState(() => currentMealSlot(today).time);
    const queries = useMealPhotos(restaurants, date, timeStringToMealType(meal));
    const [viewer, setViewer] = useState<ViewerState | null>(null);
    const [uploadFor, setUploadFor] = useState<number | null>(null);

    usePullToRefresh();

    // Wait for every section's height, or the linked one lands off target.
    const scrolled = useRef(false);
    const settled = queries.every((q) => !q.isPending);
    useEffect(() => {
        if (scrolled.current || !settled || !linkedId) return;
        scrolled.current = true;
        document.getElementById(`restaurant-${linkedId}`)?.scrollIntoView();
    }, [settled, linkedId]);

    return (
        <Screen withTabBar={false}>
            <AppHeader title="메뉴 사진" />

            <div className="flex items-center justify-between px-5 pt-1">
                <span className="text-[16px] font-bold text-[#222222]">
                    오늘 {today.getMonth() + 1}월 {today.getDate()}일
                </span>
                <MealSegment value={meal} onChange={setMeal} />
            </div>

            {restaurants.map((restaurant, i) => {
                const { id } = restaurant;
                const q = queries[i];
                const photos = q.data?.results ?? [];
                return (
                    <section key={id} id={`restaurant-${id}`} className="scroll-mt-[calc(56px+var(--ara-safe-top))] px-5 pt-6">
                        <h2 className="flex items-baseline gap-[6px] text-[16px] font-semibold text-black">
                            {displayRestaurantName(restaurant)}
                            {q.data && <span className="text-[14px] font-medium text-[#999999]">{q.data.num_items}장</span>}
                        </h2>
                        <div className="mt-3">
                            {q.isPending ? (
                                <div className="grid grid-cols-3 gap-[10px]">
                                    {[0, 1, 2].map((k) => (
                                        <Skeleton key={k} className="aspect-square rounded-[12px]" />
                                    ))}
                                </div>
                            ) : q.isError ? (
                                <p className="text-[14px] text-[#BBBBBB]">사진을 불러오지 못했어요</p>
                            ) : photos.length === 0 ? (
                                <button
                                    type="button"
                                    onClick={() => setUploadFor(id)}
                                    className="flex w-full flex-col items-center rounded-[15px] bg-[#F6F6F6] py-7 text-center"
                                >
                                    <CameraIcon size={40} className="text-[#C8C8C8]" />
                                    <span className="mt-2 text-[15px] font-semibold text-[#333333]">아직 올라온 사진이 없어요</span>
                                    <span className="mt-1 text-[13px] text-[#999999]">첫 사진을 올려 주세요</span>
                                </button>
                            ) : (
                                <div className="grid grid-cols-3 gap-[10px]">
                                    {photos.map((photo, index) => (
                                        <button
                                            key={photo.id}
                                            type="button"
                                            onClick={() => setViewer({ photos, index })}
                                            className="relative aspect-square overflow-hidden rounded-[12px]"
                                        >
                                            <PhotoCover photo={photo} sizes="33vw" />
                                            {photo.source === 'INSTAGRAM' && <PhotoLabel>자동 수집</PhotoLabel>}
                                            {photo.is_official && <OfficialBadge className="right-2 top-2" />}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </section>
                );
            })}
            <div aria-hidden className="h-[96px] shrink-0" />

            <FixedBottomBar fade>
                <CtaButton onClick={() => setUploadFor(linkedId ?? defaultRestaurant(restaurants).id)}>사진 올리기</CtaButton>
            </FixedBottomBar>

            {viewer && <PhotoViewer state={viewer} onChange={setViewer} />}
            <UploadPhotoSheet
                restaurant={uploadFor}
                meal={meal}
                date={date}
                onClose={() => setUploadFor(null)}
                onUploaded={(uploaded) => {
                    setUploadFor(null);
                    setMeal(uploaded);
                }}
            />
        </Screen>
    );
}

export default function MealPhotosPage() {
    return (
        <Suspense fallback={null}>
            <MealPhotosInner />
        </Suspense>
    );
}
