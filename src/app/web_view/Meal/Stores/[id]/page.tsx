'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { AppHeader, BottomSheet, LeftChevronIcon, NotifyIcon, Screen, Skeleton } from '@/app/web_view/_components';
import { useStore } from '@/app/web_view/_query';
import { usePullToRefresh } from '@/app/web_view/hooks/usePullToRefresh';
import { useSafeBack } from '@/app/web_view/hooks/useSafeBack';
import { apiDetail, errorStatus } from '@/lib/api/store';
import { formatWon } from '@/lib/delivery';
import { storeLine } from '@/lib/store';
import type { StoreMenu, StoreNotice } from '@/lib/types/store';
import { EmptyState } from '../_components/EmptyState';
import { SignatureBadge } from '../_components/SignatureBadge';
import { StoreCover } from '../_components/StoreCover';
import { StoreStatusLine } from '../_components/StoreStatusLine';

// Seeded with '' so section-less menus lead.
function groupMenus(menus: StoreMenu[]): { title: string; menus: StoreMenu[] }[] {
    if (!menus.some((m) => m.section)) return [{ title: '', menus }];
    const groups = new Map<string, StoreMenu[]>([['', []]]);
    menus.forEach((m) => groups.set(m.section, [...(groups.get(m.section) ?? []), m]));
    return [...groups].filter(([, list]) => list.length > 0).map(([title, list]) => ({ title, menus: list }));
}

const Divider = () => <div className="mx-5 h-px bg-[#F0F0F0]" />;

function MenuRow({ menu }: { menu: StoreMenu }) {
    const out = menu.is_sold_out;
    return (
        <div className="flex items-center gap-4 px-5 py-4">
            <div className="min-w-0 flex-1">
                <p className="flex items-center gap-[6px]">
                    <span className={`truncate text-[16px] font-medium ${out ? 'text-[#B0B0B0]' : 'text-[#222222]'}`}>{menu.name}</span>
                    {menu.is_signature && <SignatureBadge />}
                    {out && (
                        <span className="shrink-0 rounded-[5px] bg-[#F0F0F0] px-[6px] py-[2px] text-[11px] font-bold leading-[13px] text-[#8A8A8A]">품절</span>
                    )}
                </p>
                {menu.description && <p className={`mt-1 text-[13px] ${out ? 'text-[#B0B0B0]' : 'text-[#646464]'}`}>{menu.description}</p>}
                <p className={`mt-2 text-[15px] font-bold ${out ? 'text-[#B0B0B0] line-through' : 'text-[#222222]'}`}>{formatWon(menu.price)}</p>
            </div>
            <StoreCover src={menu.photo} alt={menu.name} sizes="76px" className="h-[76px] w-[76px] shrink-0 rounded-[8px]" />
        </div>
    );
}

function NoticeSheet({ notices, open, onClose }: { notices: StoreNotice[]; open: boolean; onClose: () => void }) {
    return (
        <BottomSheet open={open} onClose={onClose} title="공지">
            <div className="px-5">
                {notices.map((n, i) => (
                    <div key={n.id}>
                        {i > 0 && <div className="my-4 h-px bg-[#F0F0F0]" />}
                        <h3 className="break-keep text-[16px] font-bold text-[#222222]">{n.title}</h3>
                        {n.body && <p className="mt-2 whitespace-pre-line break-keep text-[15px] leading-[1.6] text-[#333333]">{n.body}</p>}
                    </div>
                ))}
            </div>
        </BottomSheet>
    );
}

export default function StorePage() {
    const id = Number(useParams<{ id: string }>().id);
    const back = useSafeBack();
    const { data: store, isError, error } = useStore(id);
    const [noticeOpen, setNoticeOpen] = useState(false);

    usePullToRefresh();

    if (isError || !(id > 0)) {
        const notFound = !(id > 0) || errorStatus(error) === 404;
        return (
            <Screen withTabBar={false}>
                <AppHeader title="입주 업체" />
                <div className="flex flex-1 flex-col items-center justify-center pb-20 text-center">
                    <p className="text-[16px] font-bold text-[#222222]">{notFound ? '업체를 찾을 수 없어요' : apiDetail(error)}</p>
                    <button type="button" onClick={back} className="mt-5 h-[44px] rounded-[10px] bg-[#F6F6F6] px-6 text-[15px] font-medium text-[#646464]">
                        돌아가기
                    </button>
                </div>
            </Screen>
        );
    }

    const groups = store ? groupMenus(store.menus) : [];
    const line = store ? storeLine(store) : '';

    return (
        <Screen withTabBar={false}>
            <div className="relative">
                <StoreCover src={store?.cover ?? null} alt={store?.name ?? ''} sizes="100vw" iconSize={32} priority className="h-[260px] w-full" />
                <button
                    type="button"
                    aria-label="뒤로"
                    onClick={back}
                    className="absolute left-5 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/35 text-white"
                >
                    <LeftChevronIcon size={20} />
                </button>
            </div>

            {!store ? (
                <div className="px-5 py-5">
                    <Skeleton className="h-[26px] w-1/2 rounded" />
                    <Skeleton className="mt-2 h-[14px] w-1/3 rounded" />
                    <Skeleton className="mt-2 h-[14px] w-2/5 rounded" />
                </div>
            ) : (
                <>
                    <div className="px-5 py-5">
                        <h1 className="break-keep text-[22px] font-bold text-[#222222]">{store.name}</h1>
                        {line && <p className="mt-1 text-[14px] text-[#646464]">{line}</p>}
                        <p className="mt-[2px] text-[14px] text-[#646464]">
                            {store.today_hours ?? '오늘 휴무'}
                            {store.hours_note && ` · ${store.hours_note}`}
                        </p>
                        <StoreStatusLine store={store} variant="full" className="mt-1" />
                        {store.intro && <p className="mt-2 break-keep text-[14px] text-[#222222]">{store.intro}</p>}
                        {store.notices.length > 0 && (
                            <button
                                type="button"
                                onClick={() => setNoticeOpen(true)}
                                className="mt-3 flex h-11 w-full items-center rounded-[10px] bg-[#FFF8E5] px-4 text-left"
                            >
                                <NotifyIcon size={18} className="text-ara_red" />
                                <span className="ml-2 shrink-0 text-[14px] font-bold text-ara_red">공지</span>
                                <span className="ml-4 min-w-0 flex-1 truncate text-[14px] text-[#333333]">{store.notices[0].title}</span>
                            </button>
                        )}
                    </div>

                    <div className="h-2 bg-[#F6F6F6]" />

                    <h2 className="px-5 pb-1 pt-5 text-[18px] font-bold text-[#222222]">메뉴</h2>
                    {store.menus.length === 0 ? (
                        <EmptyState title="등록된 메뉴가 없어요" description="업체가 메뉴를 등록하면 보여드릴게요" className="py-16" />
                    ) : (
                        groups.map((g, gi) => (
                            <section key={g.title}>
                                {gi > 0 && <Divider />}
                                {g.title && <h3 className="px-5 pb-1 pt-4 text-[14px] text-[#646464]">{g.title}</h3>}
                                {g.menus.map((m, i) => (
                                    <div key={m.id}>
                                        {i > 0 && <Divider />}
                                        <MenuRow menu={m} />
                                    </div>
                                ))}
                            </section>
                        ))
                    )}
                    <div className="h-5" />

                    <NoticeSheet notices={store.notices} open={noticeOpen} onClose={() => setNoticeOpen(false)} />
                </>
            )}
        </Screen>
    );
}
