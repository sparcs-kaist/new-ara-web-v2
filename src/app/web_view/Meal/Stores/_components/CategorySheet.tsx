'use client';

import { useState } from 'react';
import { BottomSheet, ConfirmDialog } from '@/app/web_view/_components';
import { useInvalidateStores } from '@/app/web_view/_query';
import { CtaButton } from '@/app/web_view/Delivery/_components/BottomCta';
import { INPUT_CLASS } from '@/app/web_view/Delivery/_components/fields';
import { apiDetail, createCategory, deleteCategory, updateCategory } from '@/lib/api/store';
import type { StoreMenuCategory } from '@/lib/types/store';

interface CategorySheetProps {
    storeId: number;
    category: StoreMenuCategory | null;
    onClose: () => void;
    onSaved?: (category: StoreMenuCategory) => void;
}

// BottomSheet unmounts its children when closed, so each opening starts a fresh form.
function CategoryForm({ storeId, category, onClose, onSaved }: CategorySheetProps) {
    const invalidate = useInvalidateStores();
    const [name, setName] = useState(category?.name ?? '');
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const trimmed = name.trim();

    const run = async (work: () => Promise<StoreMenuCategory | void>) => {
        if (busy) return;
        setBusy(true);
        setError(null);
        try {
            const saved = await work();
            await invalidate();
            if (saved) onSaved?.(saved);
            onClose();
        } catch (e) {
            setConfirmDelete(false);
            setError(apiDetail(e));
            setBusy(false);
        }
    };

    const save = () => {
        if (!trimmed) return;
        if (category && trimmed === category.name) return onClose();
        run(() => (category ? updateCategory(storeId, category.id, { name: trimmed }) : createCategory(storeId, { name: trimmed })));
    };

    return (
        <div className="px-5">
            <input name="name" value={name} maxLength={20} aria-label="카테고리 이름" placeholder="예) 덮밥" onChange={(e) => setName(e.target.value)} className={INPUT_CLASS} />
            {error && <p className="mt-3 text-[13px] text-ara_red">{error}</p>}
            <div className="mt-5">
                <CtaButton disabled={busy || !trimmed} onClick={save}>
                    {category ? '저장하기' : '추가하기'}
                </CtaButton>
            </div>
            {category && (
                <button type="button" onClick={() => setConfirmDelete(true)} className="mt-2 h-11 w-full text-center text-[14px] font-medium text-ara_red">
                    삭제
                </button>
            )}
            {confirmDelete && category && (
                <ConfirmDialog
                    title="카테고리를 삭제할까요?"
                    secondary={{ label: '취소', onClick: () => setConfirmDelete(false) }}
                    primary={{ label: '삭제', onClick: () => run(() => deleteCategory(storeId, category.id)), disabled: busy }}
                    onClose={() => setConfirmDelete(false)}
                >
                    <p className="mt-2 text-[14px] text-[#646464]">메뉴는 남고 미분류로 옮겨져요</p>
                </ConfirmDialog>
            )}
        </div>
    );
}

export function CategorySheet({ open, ...props }: CategorySheetProps & { open: boolean }) {
    return (
        <BottomSheet open={open} onClose={props.onClose} title={props.category ? '카테고리 수정' : '카테고리 추가'}>
            <CategoryForm {...props} />
        </BottomSheet>
    );
}
