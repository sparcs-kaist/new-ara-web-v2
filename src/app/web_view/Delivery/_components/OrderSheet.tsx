'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { BottomSheet } from '@/app/web_view/_components';
import { DELIVERY_KEY } from '@/app/web_view/_query';
import { useNow } from '@/app/web_view/hooks/useNow';
import { apiDetail, createDeliveryOrder, updateDeliveryOrder } from '@/lib/api/delivery';
import { formatRemaining, formatWon, isRecruitingOpen } from '@/lib/delivery';
import type { DeliveryOrder, DeliveryParty } from '@/lib/types/delivery';
import { CtaButton } from './BottomCta';
import { INPUT_CLASS, NumberInput } from './fields';

/** 주문 등록 sheet; given `order`, it edits that order instead. */
export function OrderSheet({
    open,
    party,
    order,
    onClose,
}: {
    open: boolean;
    party: DeliveryParty;
    order?: DeliveryOrder;
    onClose: () => void;
}) {
    const qc = useQueryClient();
    const now = useNow();
    const [prevOpen, setPrevOpen] = useState(false);
    // Copied on open so the sheet keeps its mode while sliding out.
    const [editing, setEditing] = useState<DeliveryOrder | undefined>();
    const [menu, setMenu] = useState('');
    const [price, setPrice] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    if (open !== prevOpen) {
        setPrevOpen(open);
        if (open) {
            setEditing(order);
            setMenu(order?.menu_name ?? '');
            setPrice(order ? String(order.price) : '');
            setError(null);
        }
    }

    const amount = Number(price);
    const nextTotal = party.total_amount - (editing?.price ?? 0) + amount;

    const submit = async () => {
        if (amount < 1 || submitting) return;
        setSubmitting(true);
        setError(null);
        const body = { price: amount, menu_name: menu.trim() };
        try {
            if (editing) await updateDeliveryOrder(party.id, editing.id, body);
            else await createDeliveryOrder(party.id, body);
            qc.invalidateQueries({ queryKey: DELIVERY_KEY });
            onClose();
        } catch (e) {
            setError(apiDetail(e));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <BottomSheet open={open} onClose={onClose} title={editing ? '주문 수정' : '주문 등록'}>
            <div className="flex items-center justify-between gap-3 border-b border-[#F0F0F0] px-5 pb-3 text-[12px]">
                <span className="min-w-0 truncate text-[#646464]">
                    {party.store_name} · {party.place_name}
                </span>
                <span className="shrink-0 font-semibold tabular-nums text-ara_red">
                    {isRecruitingOpen(party, now) ? `마감까지 ${formatRemaining(party.deadline_at, now)}` : '모집 마감'}
                </span>
            </div>

            <div className="space-y-4 px-5 pt-4">
                <div>
                    <p className="mb-2 text-[14px] font-semibold text-black">메뉴명</p>
                    <input
                        value={menu}
                        onChange={(e) => setMenu(e.target.value)}
                        placeholder="메뉴 이름 (선택)"
                        maxLength={100}
                        className={INPUT_CLASS}
                    />
                </div>
                <div>
                    <p className="mb-2 text-[14px] font-semibold text-black">가격</p>
                    <NumberInput value={price} onChange={setPrice} placeholder="0" unit="원" />
                </div>

                <div className="flex items-center justify-between gap-3 rounded-[10px] bg-ara_red_most_bright px-4 py-3">
                    <span className="shrink-0 text-[13px] text-[#646464]">{editing ? '수정하면 합계' : '등록하면 합계'}</span>
                    <span className="text-right text-[15px] font-bold text-ara_red">
                        {formatWon(party.total_amount)} → {formatWon(nextTotal)}
                    </span>
                </div>
                <p className="whitespace-pre-line text-[12px] leading-[18px] text-[#BBBBBB]">
                    {'옵션·수량은 메뉴명에 함께 적어주세요.\n방장 확정 전까지 수정·취소할 수 있어요.'}
                </p>

                {error && <p className="text-[13px] text-ara_red">{error}</p>}
                <CtaButton disabled={amount < 1 || submitting} onClick={submit}>
                    {editing ? '수정하기' : '주문 등록하기'}
                </CtaButton>
            </div>
        </BottomSheet>
    );
}
