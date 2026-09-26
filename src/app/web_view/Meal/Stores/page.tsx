'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AppHeader, ChoiceChip, ChoiceChipRow, Close2Icon, Screen, SearchIcon, Skeleton } from '@/app/web_view/_components';
import { useStores } from '@/app/web_view/_query';
import { usePullToRefresh } from '@/app/web_view/hooks/usePullToRefresh';
import { useSafeBack } from '@/app/web_view/hooks/useSafeBack';
import { apiDetail } from '@/lib/api/store';
import { storeLine } from '@/lib/store';
import { ZONE_LABELS, type Zone } from '@/lib/types/store';
import { EmptyState } from './_components/EmptyState';
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
    const [draft, setDraft] = useState('');
    const [search, setSearch] = useState('');
    const { data, isPending, isError, error } = useStores(search);
    const enter = useEntrance(!!data);
    const stores = (zone ? data?.filter((s) => s.zone === zone) : data) ?? [];

    usePullToRefresh();

    useEffect(() => {
        const t = window.setTimeout(() => setSearch(draft.trim()), 300);
        return () => window.clearTimeout(t);
    }, [draft]);

    return (
        <Screen withTabBar={false}>
            <AppHeader title="입주 업체" onBack={back} />

            <div className="px-5 pt-1">
                <label className="flex h-[42px] items-center rounded-[10px] bg-[#F0F0F0] pl-[6px] pr-1">
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
                        placeholder="업체 · 메뉴 검색"
                        enterKeyHint="search"
                        className="min-w-0 flex-1 bg-transparent text-[16px] font-medium text-black placeholder:font-medium placeholder:text-[#BBBBBB] focus:outline-none [&::-webkit-search-cancel-button]:hidden"
                    />
                    {draft && (
                        <button type="button" aria-label="검색어 지우기" onClick={() => setDraft('')} className="flex h-8 w-8 shrink-0 items-center justify-center text-[#BBBBBB]">
                            <Close2Icon size={18} />
                        </button>
                    )}
                </label>
            </div>

            <ChoiceChipRow role="tablist">
                {ZONES.map((z) => (
                    <ChoiceChip
                        key={z}
                        role="tab"
                        variant="filled"
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
                        <div key={i} className="flex items-center gap-4 px-5 py-[14px]">
                            <Skeleton className="h-[88px] w-[88px] shrink-0 rounded-[8px]" />
                            <div className="flex-1">
                                <Skeleton className="h-[17px] w-[55%] rounded" />
                                <Skeleton className="mt-2 h-[14px] w-[45%] rounded" />
                                <Skeleton className="mt-2 h-[12px] w-[35%] rounded" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : stores.length === 0 ? (
                <div className="flex flex-1 flex-col items-center justify-center pb-20 text-center">
                    {isError ? (
                        <p className="text-[14px] text-[#BBBBBB]">{apiDetail(error)}</p>
                    ) : search ? (
                        <>
                            <p className="text-[16px] font-semibold text-black">검색 결과가 없어요</p>
                            <p className="mt-1 text-[14px] text-[#BBBBBB]">다른 이름이나 메뉴로 찾아보세요</p>
                        </>
                    ) : zone ? (
                        <EmptyState title="이 구역에는 아직 업체가 없어요" />
                    ) : (
                        <EmptyState title="아직 등록된 업체가 없어요" description="입주 업체가 등록되면 여기에서 볼 수 있어요" />
                    )}
                </div>
            ) : (
                <ul>
                    {stores.map((s, i) => {
                        const line = storeLine(s);
                        return (
                            <li key={s.id} {...enter(s.id, i)}>
                                <button
                                    type="button"
                                    onClick={() => router.push(`/web_view/Meal/Stores/${s.id}`)}
                                    className="flex w-full items-center gap-4 px-5 py-[14px] text-left"
                                >
                                    <StoreCover src={s.cover} alt={s.name} sizes="88px" iconSize={28} priority={i === 0} className="h-[88px] w-[88px] shrink-0 rounded-[8px]" />
                                    <span className="min-w-0 flex-1">
                                        <span className="block truncate text-[17px] font-semibold text-[#222222]">{s.name}</span>
                                        {line && <span className="mt-[2px] block truncate text-[14px] text-[#646464]">{line}</span>}
                                        <StoreStatusLine store={s} variant="list" className="mt-1" />
                                    </span>
                                </button>
                                {i < stores.length - 1 && <div className="mx-5 h-px bg-[#F0F0F0]" />}
                            </li>
                        );
                    })}
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
