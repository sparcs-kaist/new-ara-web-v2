'use client';

import { InformationIcon } from '@/app/web_view/_components';
import { useNow } from '@/app/web_view/hooks/useNow';
import { formatRemaining, formatWon, isRecruitingOpen, orderTotal, ordersAllowed, remainingAmount } from '@/lib/delivery';
import type { ChatPaymentRequest } from '@/lib/types/chat';
import type { DeliveryOrder, DeliveryParty } from '@/lib/types/delivery';

interface Lines {
    label: string;
    value: string;
    top?: string;
    bottom?: string;
}

const CANCEL_REASON: Record<DeliveryParty['cancel_reason'], string> = {
    HOST: '방장이 모집을 취소했어요',
    NO_DECISION: '시간 초과로 자동 취소됐어요',
    '': '모집이 취소됐어요',
};

function settlingLines(party: DeliveryParty, myOrders: DeliveryOrder[], payment: ChatPaymentRequest): Lines | undefined {
    const mine = payment.targets.find((t) => t.user.is_mine);
    if (mine) {
        return {
            label: '정산 중',
            value: `보낼 금액 ${formatWon(mine.amount)}`,
            bottom: mine.paid_at ? '송금 완료' : `배송비 ${formatWon(mine.amount - orderTotal(myOrders))} 포함`,
        };
    }
    if (!party.is_host) return undefined;
    const paid = payment.targets.filter((t) => t.paid_at).length;
    return {
        label: '정산 중',
        value: `총 ${formatWon(payment.total_amount)}`,
        bottom: `${paid}/${payment.targets.length} 송금 완료`,
    };
}

function statusLines(party: DeliveryParty, now: number, myOrders: DeliveryOrder[], payment?: ChatPaymentRequest): Lines {
    const total = `합계 ${formatWon(party.total_amount)}`;
    const toMin =
        party.total_amount >= party.min_order_amount ? '최소 금액 충족' : `주문까지 ${formatWon(remainingAmount(party))}`;
    const mine = `내 주문 ${formatWon(orderTotal(myOrders))}`;
    const settling = payment && settlingLines(party, myOrders, payment);
    switch (party.status) {
        case 'RECRUITING':
            return {
                label: '주문 받는 중',
                value: total,
                top: isRecruitingOpen(party, now) ? `${formatRemaining(party.deadline_at, now)} 남음` : '마감 처리 중',
                bottom: toMin,
            };
        case 'WAITING_DECISION':
            return { label: '모집 마감', value: total, bottom: toMin };
        case 'ORDERED':
            return settling || { label: '주문 확정', value: mine, bottom: '배송비 별도' };
        case 'ARRIVED':
            return settling || { label: '배달 도착', value: mine, bottom: '정산 대기' };
        case 'SETTLED':
            return { label: '정산 완료', value: mine };
        case 'CANCELED':
            return { label: '취소된 방', value: CANCEL_REASON[party.cancel_reason] };
    }
}

/** Party status strip under the delivery room header. */
export function DeliveryStatusBar({
    party,
    myOrders,
    payment,
}: {
    party: DeliveryParty;
    myOrders: DeliveryOrder[];
    payment?: ChatPaymentRequest;
}) {
    const now = useNow();
    const { label, value, top, bottom } = statusLines(party, now, myOrders, payment);
    const min = party.min_order_amount;
    const progress = min > 0 ? Math.min(100, (party.total_amount / min) * 100) : 100;

    return (
        <div className="relative shrink-0 bg-[#F6F6F6] px-5 py-3">
            <div className="flex h-[18px] items-center justify-between gap-3 text-[12px]">
                <span className="font-semibold text-[#222222]">{label}</span>
                {top && <span className="tabular-nums text-[#888888]">{top}</span>}
            </div>
            <div className="mt-1 flex items-center justify-between gap-3">
                <span className="min-w-0 truncate text-[18px] font-bold text-[#222222]">{value}</span>
                {bottom && <span className="shrink-0 text-[12px] text-[#888888]">{bottom}</span>}
            </div>
            {ordersAllowed(party) && (
                <div className="absolute inset-x-0 bottom-0 h-[2px] bg-[#F0F0F0]">
                    <div className="h-full bg-ara_red" style={{ width: `${progress}%` }} />
                </div>
            )}
        </div>
    );
}

function composerNote(party: DeliveryParty): string | null {
    switch (party.status) {
        case 'RECRUITING':
            return '방장이 주문을 확정하기 전까지 수정·취소 가능';
        case 'WAITING_DECISION':
            return party.is_host ? '연장하거나 확정해주세요' : '마감됐어요. 방장의 결정을 기다려요';
        case 'ORDERED':
            return party.payment_request ? '송금 완료 후 퇴장 가능' : '주문 확정 이후 수정·취소 불가';
        case 'ARRIVED':
            return party.payment_request ? '송금 완료 후 퇴장 가능' : '방장의 정산 요청 대기';
        default:
            return null;
    }
}

/** One-line hint above the delivery room composer. */
export function DeliveryComposerNote({ party }: { party: DeliveryParty }) {
    const note = composerNote(party);
    if (!note) return null;
    return (
        <p className="flex shrink-0 items-center justify-center gap-1 border-t border-[#F0F0F0] bg-[#F6F6F6] px-5 py-[10px] text-[12px] text-[#646464]">
            <InformationIcon size={14} />
            {note}
        </p>
    );
}
