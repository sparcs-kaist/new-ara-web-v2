'use client';

import { useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { RightChevronIcon } from '@/app/web_view/_components';
import { storeKey, useInvalidateStores } from '@/app/web_view/_query';
import { usePullToRefresh } from '@/app/web_view/hooks/usePullToRefresh';
import { apiDetail, updateMenu } from '@/lib/api/store';
import { formatWon } from '@/lib/delivery';
import type { StoreDetail, StoreMenu } from '@/lib/types/store';
import { EmptyState } from '../../../_components/EmptyState';
import { ManageScreen, manageUrl } from '../../../_components/ManageScreen';
import { SignatureBadge } from '../../../_components/SignatureBadge';
import { StoreCover } from '../../../_components/StoreCover';
import { ChevronRow, DashedButton } from '../../../_components/formParts';
import { ReorderHandle, useHoldToReorder } from '../../../_components/reorder';

function MenuList({ store }: { store: StoreDetail }) {
    const router = useRouter();
    const qc = useQueryClient();
    const invalidate = useInvalidateStores();
    const [error, setError] = useState<string | null>(null);
    const menus = store.menus;
    const menusRef = useRef(menus);
    menusRef.current = menus;
    const categoryNames = new Map(store.categories.map((c) => [c.id, c.name]));
    const base = `${manageUrl(store.id)}/Menus`;

    usePullToRefresh();

    const setMenus = (next: StoreMenu[]) => qc.setQueryData<StoreDetail>(storeKey(store.id), (old) => (old ? { ...old, menus: next } : old));

    const toggleSoldOut = async (m: StoreMenu) => {
        setMenus(menusRef.current.map((x) => (x.id === m.id ? { ...x, is_sold_out: !m.is_sold_out } : x)));
        setError(null);
        try {
            await updateMenu(store.id, m.id, { is_sold_out: !m.is_sold_out });
        } catch (e) {
            setError(apiDetail(e));
        }
        invalidate();
    };

    const commit = async (from: number, to: number) => {
        const next = [...menusRef.current];
        const [moved] = next.splice(from, 1);
        next.splice(to, 0, moved);
        setMenus(next.map((m, i) => ({ ...m, order: i })));
        setError(null);
        try {
            await Promise.all(next.map((m, i) => (m.order === i ? null : updateMenu(store.id, m.id, { order: i }))));
        } catch (e) {
            setError(apiDetail(e));
        }
        invalidate();
    };

    const { dragging, onHandleDown, rowProps } = useHoldToReorder(menus.length, commit);

    return (
        <div className="pb-8">
            <div className="px-5">
                <ChevronRow
                    label="카테고리 관리"
                    value={store.categories.length ? `${store.categories.length}개` : '없음'}
                    onClick={() => router.push(`${manageUrl(store.id)}/Categories`)}
                />
            </div>
            <div className="h-2 bg-[#F6F6F6]" />
            {menus.length === 0 ? (
                <EmptyState title="메뉴를 추가해 보세요" className="py-10" />
            ) : (
                <ul className={dragging ? 'select-none' : ''}>
                    {menus.map((m, i) => {
                        const out = m.is_sold_out;
                        const categoryName = m.category === null ? undefined : categoryNames.get(m.category);
                        return (
                            <li key={m.id} {...rowProps(m.id, i)}>
                                <div className="mx-5 flex h-[72px] items-center gap-3 border-b border-[#F0F0F0]">
                                    <ReorderHandle label={`${m.name} 순서 이동`} onPointerDown={onHandleDown(m.id, i)} />
                                    <StoreCover src={m.photo} alt={m.name} sizes="56px" iconSize={20} className="h-14 w-14 shrink-0 rounded-[8px]" />
                                    <button type="button" onClick={() => router.push(`${base}/${m.id}`)} className="min-w-0 flex-1 text-left">
                                        <span className="flex items-center gap-[6px]">
                                            <span className={`truncate text-[15px] font-medium ${out ? 'text-[#B0B0B0]' : 'text-[#222222]'}`}>{m.name}</span>
                                            {m.is_signature && <SignatureBadge />}
                                        </span>
                                        <span className="mt-[2px] flex items-center gap-[6px]">
                                            <span className={`shrink-0 text-[13px] ${out ? 'text-[#B0B0B0]' : 'text-[#646464]'}`}>{formatWon(m.price)}</span>
                                            {categoryName && (
                                                <span className="truncate rounded-[5px] bg-[#F0F0F0] px-[6px] py-[2px] text-[11px] leading-[13px] text-[#8A8A8A]">{categoryName}</span>
                                            )}
                                        </span>
                                    </button>
                                    <button
                                        type="button"
                                        aria-pressed={out}
                                        onClick={() => toggleSoldOut(m)}
                                        className={`h-7 shrink-0 rounded-full px-3 text-[12px] font-medium ${out ? 'bg-[#FFF1F1] text-ara_red' : 'border border-[#DDDDDD] text-[#8A8A8A]'}`}
                                    >
                                        품절
                                    </button>
                                    <button type="button" aria-label={`${m.name} 수정`} onClick={() => router.push(`${base}/${m.id}`)} className="-mr-2 flex h-10 w-8 shrink-0 items-center justify-center text-[#BBBBBB]">
                                        <RightChevronIcon size={18} />
                                    </button>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            )}
            <div className="px-5 pt-5">
                <DashedButton onClick={() => router.push(`${base}/new`)}>+ 메뉴 추가</DashedButton>
                {menus.length > 1 && <p className="mt-2 text-center text-[12px] text-[#8A8A8A]">길게 눌러 순서를 바꿀 수 있어요</p>}
                {error && <p className="mt-2 text-center text-[13px] text-ara_red">{error}</p>}
            </div>
        </div>
    );
}

export default function MenusPage() {
    const id = Number(useParams<{ id: string }>().id);
    return (
        <ManageScreen id={id} title="메뉴 관리">
            {(store) => <MenuList key={store.id} store={store} />}
        </ManageScreen>
    );
}
