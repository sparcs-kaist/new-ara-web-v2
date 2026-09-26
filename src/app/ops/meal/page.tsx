'use client';

import { useState } from 'react';
import { notFound } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { fetchMe } from '@/lib/api/user';
import { apiDetail, errorStatus, opsFetchStores } from '@/lib/api/store';
import { Button } from './_components/ui';
import { OPS_STORES_KEY } from './_components/keys';
import StoresSection from './_components/StoresSection';
import RestaurantsSection from './_components/RestaurantsSection';
import PhotosSection from './_components/PhotosSection';

const SECTIONS = [
    { id: 'stores', label: '입주 업체' },
    { id: 'restaurants', label: '학식 식당' },
    { id: 'photos', label: '메뉴 사진' },
] as const;

type Section = (typeof SECTIONS)[number]['id'];

export default function OpsMealPage() {
    const [section, setSection] = useState<Section>('stores');
    // Bumped on every nav click so a section's sub-view (edit/staff/menus) resets to its list.
    const [visit, setVisit] = useState(0);
    const { data: me } = useQuery<{ nickname?: string }>({ queryKey: ['me'], queryFn: fetchMe, staleTime: 10 * 60_000 });
    const stores = useQuery({ queryKey: OPS_STORES_KEY, queryFn: opsFetchStores, retry: false });

    // The console must look like it does not exist to non-staff.
    if (stores.isError && [401, 403].includes(errorStatus(stores.error) ?? 0)) notFound();

    return (
        <div className="mx-auto w-full max-w-[1280px] bg-white text-[#222222]">
            <div className="flex h-14 items-center justify-between border-b border-[#F0F0F0] px-6">
                <h1 className="text-[16px] font-bold">식사 탭 관리</h1>
                {me?.nickname && <span className="text-[14px] text-[#8A8A8A]">{me.nickname} (운영진)</span>}
            </div>
            {stores.isPending ? (
                <p className="p-6 text-[14px] text-[#8A8A8A]">불러오는 중…</p>
            ) : stores.isError ? (
                <div className="flex items-center gap-3 p-6 text-[14px]">
                    <span className="text-[#ED3A3A]">{apiDetail(stores.error)}</span>
                    <Button onClick={() => stores.refetch()}>다시 시도</Button>
                </div>
            ) : (
                <div className="flex min-h-[calc(100vh-136px)]">
                    <nav className="w-[200px] shrink-0 bg-[#FAFAFA] p-3">
                        {SECTIONS.map((s) => (
                            <button
                                key={s.id}
                                type="button"
                                aria-current={section === s.id ? 'page' : undefined}
                                onClick={() => {
                                    setSection(s.id);
                                    setVisit((v) => v + 1);
                                }}
                                className={`mb-1 block h-9 w-full rounded-[8px] px-3 text-left text-[14px] ${section === s.id ? 'bg-[#EFEFEF] font-medium' : 'hover:bg-[#F3F3F3]'}`}
                            >
                                {s.label}
                            </button>
                        ))}
                    </nav>
                    <div className="min-w-0 flex-1 px-6 py-8">
                        {section === 'stores' && <StoresSection key={visit} stores={stores.data} />}
                        {section === 'restaurants' && <RestaurantsSection />}
                        {section === 'photos' && <PhotosSection />}
                    </div>
                </div>
            )}
        </div>
    );
}
