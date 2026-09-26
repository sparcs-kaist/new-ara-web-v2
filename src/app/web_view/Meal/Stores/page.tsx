'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AppHeader, ChoiceChip, ChoiceChipRow, LeftChevronIcon, Screen, Skeleton } from '@/app/web_view/_components';
import { useStores } from '@/app/web_view/_query';
import { usePullToRefresh } from '@/app/web_view/hooks/usePullToRefresh';
import { useSafeBack } from '@/app/web_view/hooks/useSafeBack';
import { apiDetail } from '@/lib/api/store';
import { ZONE_LABELS, type Zone } from '@/lib/types/store';
import { EmptyState } from './_components/EmptyState';
import { SignatureBadge } from './_components/SignatureBadge';
import { StoreCover } from './_components/StoreCover';
import { StoreStatusLine } from './_components/StoreStatusLine';
import { useEntrance } from './_components/entrance';

const ZONES = ['', ...(Object.keys(ZONE_LABELS) as Zone[])] as const;

const listUrl = (zone: Zone | '') => (zone ? `/web_view/Meal/Stores?zone=${zone}` : '/web_view/Meal/Stores');

function StoreListInner() {
    const router = useRouter();
    const back = useSafeBack();
    const zoneParam = useSearchParams().get('zone');
    const zone: Zone | '' = zoneParam && zoneParam in ZONE_LABELS ? (zoneParam as Zone) : '';
    const { data, isPending, isError, error } = useStores();
    const enter = useEntrance(!!data);
    const stores = (zone ? data?.filter((s) => s.zone === zone) : data) ?? [];

    usePullToRefresh();

    return (
        <Screen withTabBar={false}>
            <AppHeader
                title="입주 업체"
                leading={
                    <button type="button" onClick={back} className="flex items-center text-ara_red" aria-label="뒤로">
                        <LeftChevronIcon size={32} />
                        <span className="ml-1 text-[17px] font-medium text-ara_red">식사</span>
                    </button>
                }
                // Balances the wide leading so the title sits at the screen centre.
                trailing={<span aria-hidden className="w-[66px]" />}
            />

            <ChoiceChipRow role="tablist">
                {ZONES.map((z) => (
                    <ChoiceChip
                        key={z}
                        role="tab"
                        selected={z === zone}
                        onClick={() => z !== zone && window.history.replaceState(null, '', listUrl(z))}
                    >
                        {z ? ZONE_LABELS[z] : '전체'}
                    </ChoiceChip>
                ))}
            </ChoiceChipRow>

            {isPending ? (
                <div>
                    {[0, 1, 2].map((i) => (
                        <div key={i} className="flex items-center gap-4 px-5 py-4">
                            <Skeleton className="h-24 w-24 shrink-0 rounded-[8px]" />
                            <div className="flex-1">
                                <Skeleton className="h-[17px] w-[55%] rounded" />
                                <Skeleton className="mt-2 h-[14px] w-[45%] rounded" />
                                <Skeleton className="mt-2 h-[12px] w-[35%] rounded" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : stores.length === 0 ? (
                <div className="flex flex-1 flex-col items-center justify-center pb-20">
                    {isError ? (
                        <p className="text-[14px] text-[#BBBBBB]">{apiDetail(error)}</p>
                    ) : zone ? (
                        <EmptyState title="이 구역에는 아직 업체가 없어요" />
                    ) : (
                        <EmptyState title="아직 등록된 업체가 없어요" description="입주 업체가 등록되면 여기에서 볼 수 있어요" />
                    )}
                </div>
            ) : (
                <ul>
                    {stores.map((s, i) => (
                        <li key={s.id} {...enter(s.id, i)}>
                            <button
                                type="button"
                                onClick={() => router.push(`/web_view/Meal/Stores/${s.id}`)}
                                className="flex w-full items-center gap-4 px-5 py-4 text-left"
                            >
                                <StoreCover src={s.cover} alt={s.name} sizes="96px" iconSize={28} priority={i === 0} className="h-24 w-24 shrink-0 rounded-[8px]" />
                                <span className="min-w-0 flex-1">
                                    <span className="block truncate text-[17px] font-semibold text-[#222222]">{s.name}</span>
                                    <span className="mt-[2px] block truncate text-[14px] text-[#646464]">{s.location}</span>
                                    <StoreStatusLine store={s} className="mt-1 text-[12px]" />
                                    {s.signature_menus.length > 0 && (
                                        <span className="mt-[6px] flex items-center gap-[6px] text-[13px] text-[#646464]">
                                            <SignatureBadge />
                                            <span className="truncate">{s.signature_menus[0]}</span>
                                        </span>
                                    )}
                                </span>
                            </button>
                            {i < stores.length - 1 && <div className="mx-5 h-px bg-[#F0F0F0]" />}
                        </li>
                    ))}
                </ul>
            )}
        </Screen>
    );
}

export default function StoreListPage() {
    return (
        <Suspense fallback={null}>
            <StoreListInner />
        </Suspense>
    );
}
