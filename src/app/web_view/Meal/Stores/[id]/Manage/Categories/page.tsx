'use client';

import { useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { RightChevronIcon } from '@/app/web_view/_components';
import { storeKey, useInvalidateStores } from '@/app/web_view/_query';
import { usePullToRefresh } from '@/app/web_view/hooks/usePullToRefresh';
import { apiDetail, updateCategory } from '@/lib/api/store';
import type { StoreDetail, StoreMenuCategory } from '@/lib/types/store';
import { CategorySheet } from '../../../_components/CategorySheet';
import { EmptyState } from '../../../_components/EmptyState';
import { ManageScreen } from '../../../_components/ManageScreen';
import { DashedButton } from '../../../_components/formParts';
import { ReorderHandle, useHoldToReorder } from '../../../_components/reorder';

function CategoryList({ store }: { store: StoreDetail }) {
    const qc = useQueryClient();
    const invalidate = useInvalidateStores();
    const [error, setError] = useState<string | null>(null);
    // The category stays while the sheet slides out, so its title and name do not flash.
    const [sheet, setSheet] = useState<{ open: boolean; category: StoreMenuCategory | null }>({ open: false, category: null });
    const categories = store.categories;
    const categoriesRef = useRef(categories);
    categoriesRef.current = categories;

    usePullToRefresh();

    const commit = async (from: number, to: number) => {
        const next = [...categoriesRef.current];
        const [moved] = next.splice(from, 1);
        next.splice(to, 0, moved);
        qc.setQueryData<StoreDetail>(storeKey(store.id), (old) => (old ? { ...old, categories: next.map((c, i) => ({ ...c, order: i })) } : old));
        setError(null);
        try {
            await Promise.all(next.map((c, i) => (c.order === i ? null : updateCategory(store.id, c.id, { order: i }))));
        } catch (e) {
            setError(apiDetail(e));
        }
        invalidate();
    };

    const { dragging, onHandleDown, rowProps } = useHoldToReorder(categories.length, commit);
    const closeSheet = () => setSheet((s) => ({ ...s, open: false }));

    return (
        <div className="pb-8">
            {categories.length === 0 ? (
                <EmptyState title="카테고리가 없어요" description="메뉴를 묶어 보여 주려면 카테고리를 추가해 주세요" className="py-10" />
            ) : (
                <ul className={dragging ? 'select-none' : ''}>
                    {categories.map((c, i) => (
                        <li key={c.id} {...rowProps(c.id, i)}>
                            <div className="mx-5 flex h-[56px] items-center gap-3 border-b border-[#F0F0F0]">
                                <ReorderHandle label={`${c.name} 순서 이동`} onPointerDown={onHandleDown(c.id, i)} />
                                <button type="button" onClick={() => setSheet({ open: true, category: c })} className="flex h-full min-w-0 flex-1 items-center text-left">
                                    <span className="min-w-0 flex-1 truncate text-[15px] font-medium text-[#222222]">{c.name}</span>
                                    <span className="ml-3 shrink-0 text-[13px] text-[#8A8A8A]">{store.menus.filter((m) => m.category === c.id).length}개</span>
                                    <RightChevronIcon size={18} className="ml-1 shrink-0 text-[#BBBBBB]" />
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
            <div className="px-5 pt-5">
                <DashedButton onClick={() => setSheet({ open: true, category: null })}>+ 카테고리 추가</DashedButton>
                {categories.length > 1 && <p className="mt-2 text-center text-[12px] text-[#8A8A8A]">길게 눌러 순서를 바꿀 수 있어요</p>}
                {error && <p className="mt-2 text-center text-[13px] text-ara_red">{error}</p>}
            </div>
            <CategorySheet storeId={store.id} open={sheet.open} category={sheet.category} onClose={closeSheet} />
        </div>
    );
}

export default function CategoriesPage() {
    const id = Number(useParams<{ id: string }>().id);
    return (
        <ManageScreen id={id} title="카테고리 관리">
            {(store) => <CategoryList key={store.id} store={store} />}
        </ManageScreen>
    );
}
