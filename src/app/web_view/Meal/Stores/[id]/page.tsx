'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { AppHeader, BottomSheet, ChoiceChip, ChoiceChipRow, LeftChevronIcon, NotifyIcon, Screen, Skeleton } from '@/app/web_view/_components';
import { useStore } from '@/app/web_view/_query';
import { usePullToRefresh } from '@/app/web_view/hooks/usePullToRefresh';
import { useSafeBack } from '@/app/web_view/hooks/useSafeBack';
import { apiDetail, errorStatus } from '@/lib/api/store';
import { formatWon } from '@/lib/delivery';
import { storeLine } from '@/lib/store';
import type { StoreMenu, StoreMenuCategory, StoreNotice } from '@/lib/types/store';
import { EmptyState } from '../_components/EmptyState';
import { SignatureBadge } from '../_components/SignatureBadge';
import { StoreCover } from '../_components/StoreCover';
import { StoreStatusLine } from '../_components/StoreStatusLine';

interface MenuGroup {
    key: string;
    title: string;
    menus: StoreMenu[];
}

// A menu whose category is not in the list leads with the uncategorised ones.
function groupMenus(menus: StoreMenu[], categories: StoreMenuCategory[]): MenuGroup[] {
    const known = new Set(categories.map((c) => c.id));
    return [
        { key: 'none', title: '', menus: menus.filter((m) => m.category === null || !known.has(m.category)) },
        ...categories.map((c) => ({ key: String(c.id), title: c.name, menus: menus.filter((m) => m.category === c.id) })),
    ].filter((g) => g.menus.length > 0);
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
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const pillAnchor = useRef<HTMLDivElement>(null);
    const pillRow = useRef<HTMLDivElement>(null);
    const unlockSpy = useRef<(() => void) | null>(null);

    usePullToRefresh();

    useEffect(() => {
        const row = pillRow.current;
        if (!row) return;
        let frame = 0;
        const spy = () => {
            frame = 0;
            if (unlockSpy.current) return;
            // The stuck edge, not the current one: a first band right under the unstuck row still means 전체.
            const edge = parseFloat(getComputedStyle(row).top) + row.offsetHeight + 1;
            let current: number | null = null;
            for (const band of document.querySelectorAll<HTMLElement>('[data-category-band]')) {
                if (band.getBoundingClientRect().top > edge) break;
                current = Number(band.dataset.categoryBand);
            }
            setSelectedId(current);
        };
        const onScroll = () => {
            if (!frame) frame = requestAnimationFrame(spy);
        };
        spy();
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => {
            window.removeEventListener('scroll', onScroll);
            cancelAnimationFrame(frame);
            unlockSpy.current?.();
        };
    }, [store]);

    // Scrolls the row only; chip.scrollIntoView would also move the page.
    useEffect(() => {
        const chip = pillRow.current?.querySelector<HTMLElement>('[aria-selected="true"]');
        const row = chip?.parentElement;
        if (!chip || !row) return;
        const rowBox = row.getBoundingClientRect();
        const chipBox = chip.getBoundingClientRect();
        const inset = parseFloat(getComputedStyle(row).paddingLeft);
        const hiddenLeft = chipBox.left - (rowBox.left + inset);
        const hiddenRight = chipBox.right - (rowBox.right - inset);
        if (hiddenLeft < 0) row.scrollBy({ left: hiddenLeft, behavior: 'smooth' });
        else if (hiddenRight > 0) row.scrollBy({ left: hiddenRight, behavior: 'smooth' });
    }, [selectedId]);

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

    const categories = store ? store.categories.filter((c) => store.menus.some((m) => m.category === c.id)) : [];
    const groups = store ? groupMenus(store.menus, categories) : [];
    const line = store ? storeLine(store) : '';

    const lockSpy = () => {
        unlockSpy.current?.();
        let timer = 0;
        const settle = () => {
            window.clearTimeout(timer);
            timer = window.setTimeout(release, 400);
        };
        const release = () => {
            window.clearTimeout(timer);
            window.removeEventListener('scroll', settle);
            window.removeEventListener('scrollend', release);
            unlockSpy.current = null;
        };
        window.addEventListener('scroll', settle, { passive: true });
        window.addEventListener('scrollend', release);
        settle();
        unlockSpy.current = release;
    };

    const pick = (categoryId: number | null) => {
        setSelectedId(categoryId);
        const row = pillRow.current;
        const target = categoryId === null ? pillAnchor.current : document.querySelector(`[data-category-band="${categoryId}"]`);
        if (!row || !target) return;
        // The row may not be stuck yet when the tap starts, so aim at where it will stick.
        const stuckTop = parseFloat(getComputedStyle(row).top);
        const offset = categoryId === null ? stuckTop : stuckTop + row.offsetHeight;
        lockSpy();
        window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - offset, behavior: 'smooth' });
    };

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
                    {categories.length > 0 && (
                        <>
                            <div ref={pillAnchor} className="scroll-mt-[var(--ara-safe-top)]" />
                            <div ref={pillRow} className="sticky top-[var(--ara-safe-top)] z-30 bg-white">
                                <ChoiceChipRow role="tablist">
                                    <ChoiceChip role="tab" selected={selectedId === null} onClick={() => pick(null)}>
                                        전체
                                    </ChoiceChip>
                                    {categories.map((c) => (
                                        <ChoiceChip key={c.id} role="tab" selected={c.id === selectedId} onClick={() => pick(c.id)}>
                                            {c.name}
                                        </ChoiceChip>
                                    ))}
                                </ChoiceChipRow>
                            </div>
                        </>
                    )}
                    {store.menus.length === 0 ? (
                        <EmptyState title="등록된 메뉴가 없어요" description="업체가 메뉴를 등록하면 보여드릴게요" className="py-16" />
                    ) : (
                        groups.map((g) => (
                            <section key={g.key}>
                                {g.title && (
                                    <h3
                                        data-category-band={g.key}
                                        className="flex h-10 scroll-mt-[calc(var(--ara-safe-top)+60px)] items-center bg-[#FAFAFA] px-5 text-[14px] font-semibold text-[#222222]"
                                    >
                                        {g.title}
                                        <span className="ml-2 text-[13px] font-normal text-[#999999]">{g.menus.length}</span>
                                    </h3>
                                )}
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
