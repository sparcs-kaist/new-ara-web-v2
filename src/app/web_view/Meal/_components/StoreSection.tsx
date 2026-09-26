'use client';

import { useRouter } from 'next/navigation';
import { RightChevronIcon, Skeleton } from '@/app/web_view/_components';
import { useMyStores, useStore, useStores } from '@/app/web_view/_query';
import { MainPageTextButton } from '@/app/web_view/Main/_components/MainPageTextButton';
import { StoreCover } from '../Stores/_components/StoreCover';
import { StoreStatusLine } from '../Stores/_components/StoreStatusLine';
import { useEntrance } from '../Stores/_components/entrance';

export function StoreSection() {
    const router = useRouter();
    const { data, isPending } = useStores();
    const store = data?.find((s) => s.is_open) ?? data?.[0];
    // The list has no intro; the detail also warms the store page.
    const detail = useStore(store?.id ?? 0);
    const mine = useMyStores();
    const enter = useEntrance(!!data);
    const manageId = mine.data?.[0];

    if (!isPending && !store) return null;
    const anim = store ? enter(store.id, 0) : null;

    return (
        <section>
            <div className="mx-5 my-5 h-px bg-[#F0F0F0]" />
            <div className="flex items-center">
                <MainPageTextButton label="입주 업체" onPress={() => router.push('/web_view/Meal/Stores')} />
                {manageId !== undefined && (
                    <button
                        type="button"
                        onClick={() => router.push(`/web_view/Meal/Stores/${manageId}/Manage`)}
                        className="mr-3 flex h-9 shrink-0 items-center whitespace-nowrap pl-2 text-[13px] font-medium text-[#646464]"
                    >
                        내 식당 관리
                        <RightChevronIcon size={16} />
                    </button>
                )}
            </div>
            <div className="mt-3 px-5">
                {!store ? (
                    <Skeleton className="h-[110px] w-full rounded-[12px]" />
                ) : (
                    <>
                        <button
                            type="button"
                            onClick={() => router.push(`/web_view/Meal/Stores/${store.id}`)}
                            className={`block w-full text-left ${anim?.className}`}
                            style={anim?.style}
                        >
                            <StoreCover src={store.cover} alt={store.name} sizes="100vw" iconSize={28} className="h-[110px] w-full rounded-[12px]" />
                            <span className="mt-3 block text-[17px] font-semibold text-[#222222]">{store.name}</span>
                            <span className="mt-[2px] block text-[14px] text-[#646464]">{store.location}</span>
                            <StoreStatusLine store={store} className="mt-1 text-[12px]" />
                            {detail.data?.intro && <span className="mt-1 block truncate text-[14px] text-[#222222]">{detail.data.intro}</span>}
                        </button>
                        <button
                            type="button"
                            onClick={() => router.push('/web_view/Meal/Stores')}
                            className="block w-full py-2 text-center text-[14px] text-[#BBBBBB]"
                        >
                            + 더보기
                        </button>
                    </>
                )}
            </div>
        </section>
    );
}
