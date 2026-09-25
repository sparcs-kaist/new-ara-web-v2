'use client';

import { InformationIcon } from '@/app/web_view/_components';
import { useNow } from '@/app/web_view/hooks/useNow';
import {
    formatRemaining,
    formatWon,
    isRecruitingOpen,
    orderTotal,
    ordersAllowed,
    remainingAmount,
    withSubject,
} from '@/lib/delivery';
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

const sum = (shares: { amount: number }[]) => shares.reduce((total, s) => total + s.amount, 0);
const latestCanceled = (payments: ChatPaymentRequest[]) => payments.filter((p) => p.canceled_at !== null).pop();

// Every live request counts, the delivery one and general ones alike; canceled ones only explain an empty state.
function settlingLines(party: DeliveryParty, myOrders: DeliveryOrder[], payments: ChatPaymentRequest[]): Lines | undefined {
    const live = payments.filter((p) => p.canceled_at === null);
    const shares = live.flatMap((p) => p.targets.filter((t) => t.user.is_mine).map((t) => ({ ...t, payment: p })));
    const unpaid = shares.filter((t) => !t.paid_at);
    if (unpaid.length) {
        const only = unpaid.length === 1 ? unpaid[0] : undefined;
        return {
            label: '정산 중',
            value: `보낼 금액 ${formatWon(sum(unpaid))}`,
            bottom:
                only &&
                (only.payment.id === party.payment_request
                    ? `배송비 ${formatWon(only.amount - orderTotal(myOrders))} 포함`
                    : `${withSubject(only.payment.requester.display_name)} 요청`),
        };
    }
    if (shares.length) return { label: '정산 완료', value: `보낸 금액 ${formatWon(sum(shares))}`, bottom: '송금 완료' };

    const requested = live.filter((p) => p.requester.is_mine).pop();
    if (requested) {
        const paid = requested.targets.filter((t) => t.paid_at).length;
        return {
            label: '정산 중',
            value: `청구 ${formatWon(requested.total_amount)}`,
            bottom: `${requested.targets.length}명 중 ${paid}명 송금`,
        };
    }

    const canceled = latestCanceled(payments);
    if (!canceled) return undefined;
    if (canceled.requester.is_mine) {
        const paid = canceled.targets.filter((t) => t.paid_at).length;
        return { label: '정산 취소됨', value: `청구 ${formatWon(canceled.total_amount)}`, bottom: `${paid}명 송금 완료` };
    }
    const refund = canceled.targets.find((t) => t.user.is_mine && t.paid_at);
    return (
        refund && {
            label: '정산 취소됨',
            value: `보낸 금액 ${formatWon(refund.amount)}`,
            bottom: `반환은 ${canceled.requester.display_name}에게 문의`,
        }
    );
}

function statusLines(party: DeliveryParty, now: number, myOrders: DeliveryOrder[], payments: ChatPaymentRequest[]): Lines {
    const total = `합계 ${formatWon(party.total_amount)}`;
    const toMin =
        party.total_amount >= party.min_order_amount ? '최소 금액 충족' : `주문까지 ${formatWon(remainingAmount(party))}`;
    const mine = `내 주문 ${formatWon(orderTotal(myOrders))}`;
    const settling = settlingLines(party, myOrders, payments);
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

export function DeliveryStatusBar({
    party,
    myOrders,
    payments,
}: {
    party: DeliveryParty;
    myOrders: DeliveryOrder[];
    /** Every payment request in the loaded messages. */
    payments: ChatPaymentRequest[];
}) {
    const now = useNow();
    const { label, value, top, bottom } = statusLines(party, now, myOrders, payments);
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

function settlingNote(party: DeliveryParty, payments: ChatPaymentRequest[]): string | undefined {
    if (party.payment_request !== null || payments.some((p) => p.canceled_at === null)) return '송금 완료 후 퇴장 가능';
    // ORDERED/ARRIVED with no live delivery request is only refused when someone had paid the previous one.
    if (party.is_host && !party.can_request_payment) return '송금한 사람이 있어 배달 정산을 다시 보낼 수 없습니다';
    const canceled = latestCanceled(payments);
    if (canceled?.targets.some((t) => t.user.is_mine && t.paid_at)) {
        return `${withSubject(canceled.requester.display_name)} 정산을 취소했습니다`;
    }
}

function composerNote(party: DeliveryParty, payments: ChatPaymentRequest[]): string | null {
    switch (party.status) {
        case 'RECRUITING':
            return '방장이 주문을 확정하기 전까지 수정·취소 가능';
        case 'WAITING_DECISION':
            return party.is_host ? '연장하거나 확정해주세요' : '마감됐어요. 방장의 결정을 기다려요';
        case 'ORDERED':
            return settlingNote(party, payments) ?? '주문 확정 이후 수정·취소 불가';
        case 'ARRIVED':
            return settlingNote(party, payments) ?? '방장의 정산 요청 대기';
        default:
            return null;
    }
}

export function DeliveryComposerNote({ party, payments }: { party: DeliveryParty; payments: ChatPaymentRequest[] }) {
    const note = composerNote(party, payments);
    if (!note) return null;
    return (
        <p className="flex shrink-0 items-center justify-center gap-1 border-t border-[#F0F0F0] bg-[#F6F6F6] px-5 py-[10px] text-[12px] text-[#646464]">
            <InformationIcon size={14} />
            {note}
        </p>
    );
}
