'use client';

import { useRouter } from 'next/navigation';
import { RightChevronIcon, Skeleton } from '@/app/web_view/_components';
import { useMyStores, useStore, useStores } from '@/app/web_view/_query';
import { MainPageTextButton } from '@/app/web_view/Main/_components/MainPageTextButton';
import { storeLine } from '@/lib/store';
import { StoreCover } from '../Stores/_components/StoreCover';
import { StoreStatusLine } from '../Stores/_components/StoreStatusLine';
import { useEntrance } from '../Stores/_components/entrance';

function ManageCard({ id, name }: { id: number; name?: string }) {
    const router = useRouter();
    // Inactive stores are missing from the public list, so fall back to the detail.
    const detail = useStore(name ? 0 : id);
    const label = name ?? detail.data?.name ?? '';
    return (
        <button
            type="button"
            onClick={() => router.push(`/web_view/Meal/Stores/${id}/Manage`)}
            className="flex w-full items-center rounded-[12px] bg-[#F6F6F6] p-[14px] text-left"
        >
            <span className="min-w-0 flex-1">
                <span className="block text-[14px] font-bold text-[#222222]">내 업체 관리</span>
                <span className="mt-[2px] block truncate text-[12px] text-[#646464]">{label}</span>
            </span>
            <RightChevronIcon size={18} className="shrink-0 text-[#BBBBBB]" />
        </button>
    );
}

export function StoreSection() {
    const router = useRouter();
    const { data, isPending } = useStores();
    const store = data?.find((s) => s.is_open) ?? data?.[0];
    // The list has no intro; the detail also warms the store page.
    const detail = useStore(store?.id ?? 0);
    const mine = useMyStores();
    const enter = useEntrance(!!data);

    if (!isPending && !store) return null;
    const anim = store ? enter(store.id, 0) : null;
    const line = store ? storeLine(store) : '';

    return (
        <section>
            <div className="mx-5 my-5 h-px bg-[#F0F0F0]" />
            <MainPageTextButton label="입주 업체" onPress={() => router.push('/web_view/Meal/Stores')} />
            {mine.data && mine.data.length > 0 && (
                <div className="mt-3 space-y-2 px-5">
                    {mine.data.map((id) => (
                        <ManageCard key={id} id={id} name={data?.find((s) => s.id === id)?.name} />
                    ))}
                </div>
            )}
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
                            {line && <span className="mt-[2px] block text-[14px] text-[#646464]">{line}</span>}
                            <StoreStatusLine store={store} variant="full" className="mt-1" />
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
