'use client';

import { useRouter } from 'next/navigation';
import { Skeleton } from '@/app/web_view/_components';
import { photosFirstOrder, useMealPhotos, useRestaurants } from '@/app/web_view/_query';
import { MainPageTextButton } from '@/app/web_view/Main/_components/MainPageTextButton';
import { formatMealDate, shortRestaurantName, timeStringToMealType, type MealSlot } from '@/lib/types/meal';
import { OfficialBadge, PhotoCover, PhotoLabel } from './photoParts';
import { SectionEmpty } from './SectionEmpty';

export function MenuPhotoStrip({ slot }: { slot: MealSlot | null }) {
    const router = useRouter();
    const restaurants = useRestaurants();
    const queries = useMealPhotos(restaurants, slot && formatMealDate(), timeStringToMealType(slot?.time ?? ''));
    const settled = queries.every((q) => !q.isPending);
    const withPhotos = photosFirstOrder(queries).filter((i) => (queries[i].data?.num_items ?? 0) > 0);

    return (
        <section>
            <MainPageTextButton label="메뉴 사진" onPress={() => router.push('/web_view/Meal/Photos')} />
            {queries.every((q) => q.isError) ? (
                <p className="px-5 pt-3 text-[14px] text-[#BBBBBB]">메뉴 사진을 불러오지 못했어요</p>
            ) : !settled ? (
                <Skeleton className="mx-5 mt-3 h-11 rounded-[12px]" />
            ) : withPhotos.length === 0 ? (
                <SectionEmpty
                    text="아직 올라온 메뉴 사진이 없어요"
                    action={{ label: '첫 사진 올리기', onPress: () => router.push('/web_view/Meal/Photos') }}
                />
            ) : (
                <div className="mt-3 flex snap-x scroll-px-5 gap-[10px] overflow-x-auto px-5">
                    {withPhotos.map((i) => {
                        const restaurant = restaurants[i];
                        const { id } = restaurant;
                        const photo = queries[i].data?.results[0];
                        return (
                            <button
                                key={id}
                                type="button"
                                onClick={() => router.push(`/web_view/Meal/Photos?restaurant=${id}`)}
                                className="relative h-[108px] w-[108px] shrink-0 snap-start overflow-hidden rounded-[12px]"
                            >
                                <PhotoCover photo={photo} sizes="108px" />
                                <PhotoLabel>{shortRestaurantName(restaurant)}</PhotoLabel>
                                {photo?.is_official && <OfficialBadge className="bottom-2 right-2" />}
                            </button>
                        );
                    })}
                </div>
            )}
        </section>
    );
}
