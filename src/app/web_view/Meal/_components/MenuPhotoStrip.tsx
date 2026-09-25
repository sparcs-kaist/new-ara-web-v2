'use client';

import { useRouter } from 'next/navigation';
import { Skeleton } from '@/app/web_view/_components';
import { useMealPhotos } from '@/app/web_view/_query';
import { MainPageTextButton } from '@/app/web_view/Main/_components/MainPageTextButton';
import { formatMealDate, RESTAURANT_IDS, RESTAURANT_NAMES, timeStringToMealType, type MealSlot } from '@/lib/types/meal';
import { OfficialBadge, PhotoCover, PhotoLabel } from './photoParts';

export function MenuPhotoStrip({ slot }: { slot: MealSlot | null }) {
    const router = useRouter();
    const queries = useMealPhotos(slot && formatMealDate(), timeStringToMealType(slot?.time ?? ''));

    return (
        <section>
            <MainPageTextButton label="메뉴 사진" onPress={() => router.push('/web_view/Meal/Photos')} />
            {queries.every((q) => q.isError) ? (
                <p className="px-5 pt-3 text-[14px] text-[#BBBBBB]">메뉴 사진을 불러오지 못했어요</p>
            ) : (
                <div className="mt-3 flex snap-x scroll-px-5 gap-[10px] overflow-x-auto px-5">
                    {RESTAURANT_IDS.map((id, i) => {
                        if (queries[i].isPending) return <Skeleton key={id} className="h-[108px] w-[108px] shrink-0 rounded-[12px]" />;
                        const photo = queries[i].data?.results[0];
                        return (
                            <button
                                key={id}
                                type="button"
                                onClick={() => router.push(`/web_view/Meal/Photos?restaurant=${id}`)}
                                className="relative h-[108px] w-[108px] shrink-0 snap-start overflow-hidden rounded-[12px]"
                            >
                                <PhotoCover photo={photo} sizes="108px" />
                                <PhotoLabel>{RESTAURANT_NAMES[id]}</PhotoLabel>
                                {photo?.is_official && <OfficialBadge className="bottom-2 right-2" />}
                            </button>
                        );
                    })}
                </div>
            )}
        </section>
    );
}
