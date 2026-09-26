'use client';

import { useState } from 'react';
import { ConfirmDialog } from '@/app/web_view/_components';
import { useInvalidateStores } from '@/app/web_view/_query';
import { CtaButton, FixedBottomBar } from '@/app/web_view/Delivery/_components/BottomCta';
import { INPUT_CLASS, NumberInput } from '@/app/web_view/Delivery/_components/fields';
import { apiDetail, createMenu, deleteMenu, menuFormData, updateMenu } from '@/lib/api/store';
import type { StoreMenu } from '@/lib/types/store';
import { StoreCover } from './StoreCover';
import { CounterTextarea, Field, FieldLabel, ToggleRow, usePickedFile } from './formParts';

const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

export function MenuForm({ storeId, menu, onDone }: { storeId: number; menu: StoreMenu | null; onDone: () => void }) {
    const invalidate = useInvalidateStores();
    const [name, setName] = useState(menu?.name ?? '');
    const [price, setPrice] = useState(menu ? String(menu.price) : '');
    const [description, setDescription] = useState(menu?.description ?? '');
    const [section, setSection] = useState(menu?.section ?? '');
    const [isSignature, setIsSignature] = useState(menu?.is_signature ?? false);
    const [isSoldOut, setIsSoldOut] = useState(menu?.is_sold_out ?? false);
    const photo = usePickedFile(MAX_PHOTO_BYTES);
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);

    const valid = name.trim() !== '' && price !== '';

    const submit = async () => {
        if (!valid || busy) return;
        setBusy(true);
        setError(null);
        try {
            const body = menuFormData(
                { name: name.trim(), price: Number(price), description: description.trim(), section: section.trim(), is_signature: isSignature, is_sold_out: isSoldOut },
                photo.picked?.file,
            );
            if (menu) await updateMenu(storeId, menu.id, body);
            else await createMenu(storeId, body);
            await invalidate();
            onDone();
        } catch (e) {
            setError(apiDetail(e));
            setBusy(false);
        }
    };

    const remove = async () => {
        if (!menu || busy) return;
        setBusy(true);
        setError(null);
        try {
            await deleteMenu(storeId, menu.id);
            await invalidate();
            onDone();
        } catch (e) {
            setConfirmDelete(false);
            setError(apiDetail(e));
            setBusy(false);
        }
    };

    return (
        <>
            <div className="space-y-5 px-5 pb-[96px] pt-2">
                <div>
                    <FieldLabel>메뉴 사진</FieldLabel>
                    <div className="flex items-center gap-4">
                        <StoreCover
                            src={photo.picked?.url ?? menu?.photo ?? null}
                            alt="메뉴 사진"
                            sizes="120px"
                            iconSize={28}
                            className="h-[120px] w-[120px] shrink-0 rounded-[12px]"
                        />
                        <div className="min-w-0">
                            <button type="button" onClick={photo.open} className="h-9 rounded-full border border-[#DDDDDD] px-4 text-[13px] font-medium text-[#222222]">
                                사진 변경
                            </button>
                            <p className="mt-2 text-[12px] text-[#8A8A8A]">정사각형 사진 권장 · 최대 5MB</p>
                            {photo.error && <p className="mt-1 text-[12px] text-ara_red">{photo.error}</p>}
                        </div>
                    </div>
                    <input {...photo.inputProps} />
                </div>
                <Field label="메뉴 이름">
                    <input name="name" value={name} maxLength={100} placeholder="예) 연어덮밥" onChange={(e) => setName(e.target.value)} className={INPUT_CLASS} />
                </Field>
                <Field label="가격" as="div">
                    <NumberInput value={price} onChange={setPrice} placeholder="0" unit="원" />
                </Field>
                <Field label="설명">
                    <CounterTextarea name="description" value={description} maxLength={40} rows={2} placeholder="예) 점심 한정 20그릇" onChange={(e) => setDescription(e.target.value)} />
                </Field>
                <Field label="섹션">
                    <input name="section" value={section} maxLength={50} placeholder="예) 덮밥 (선택)" onChange={(e) => setSection(e.target.value)} className={INPUT_CLASS} />
                </Field>
                <div>
                    <div className="h-px bg-[#F0F0F0]" />
                    <ToggleRow size={15} label="대표 메뉴로 표시" helper="메뉴판과 목록 카드에 '대표' 배지가 붙어요." checked={isSignature} onChange={setIsSignature} disabled={busy} />
                    <div className="h-px bg-[#F0F0F0]" />
                    <ToggleRow size={15} label="품절로 표시" checked={isSoldOut} onChange={setIsSoldOut} disabled={busy} />
                    <div className="h-px bg-[#F0F0F0]" />
                </div>
                {menu && (
                    <button type="button" onClick={() => setConfirmDelete(true)} className="text-[15px] font-medium text-ara_red">
                        메뉴 삭제
                    </button>
                )}
                {error && <p className="text-[13px] text-ara_red">{error}</p>}
            </div>
            <FixedBottomBar>
                <CtaButton disabled={!valid || busy} onClick={submit}>
                    저장하기
                </CtaButton>
            </FixedBottomBar>
            {confirmDelete && menu && (
                <ConfirmDialog
                    title={`${menu.name}을(를) 삭제할까요?`}
                    secondary={{ label: '취소', onClick: () => setConfirmDelete(false) }}
                    primary={{ label: '삭제', onClick: remove, disabled: busy }}
                    onClose={() => setConfirmDelete(false)}
                >
                    <p className="mt-2 text-[14px] text-[#646464]">메뉴판에서 바로 사라져요.</p>
                </ConfirmDialog>
            )}
        </>
    );
}
