'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { fetchPaymentRequest } from '@/lib/api/chat';
import { PostIcon, PostListIcon, SendIcon } from '@/app/web_view/_components/icons';
import type { ReportSubject } from '@/app/web_view/_components/ReportSheet';
import { DELIVERY_KEY, useDeliveryParty } from '@/app/web_view/_query/delivery';
import type { DeliveryAction } from '@/app/web_view/Delivery/_components/DeliveryActionDialog';
import { ordersAllowed } from '@/lib/delivery';
import type { ChatPaymentRequest } from '@/lib/types/chat';
import type { DeliveryOrder, DeliveryParty } from '@/lib/types/delivery';
import type { ChatInputExtraRow } from '../components/ChatInput';
import type { Member, Message } from '../components/ChatRoomDetail';
import type { PaymentMember } from '../components/PaymentCreateSheet';

export type DeliverySheet = { kind: 'order'; order?: DeliveryOrder } | { kind: 'info' } | { kind: 'members' };

export function useDeliveryRoom({ partyId, members, myId }: { partyId: number | null; members: Member[]; myId: number | null }) {
    const router = useRouter();
    const { data: party } = useDeliveryParty(partyId, { poll: true });
    const myOrders = party?.orders?.filter(o => o.orderer.is_mine) ?? [];
    const [sheet, setSheet] = useState<DeliverySheet | null>(null);
    const [action, setAction] = useState<DeliveryAction | null>(null);
    const [promptedFor, setPromptedFor] = useState<string | null>(null);
    const [voteOpen, setVoteOpen] = useState(false);
    const [paymentOpen, setPaymentOpen] = useState(false);
    const [rerequestBlocked, setRerequestBlocked] = useState(false);
    const [report, setReport] = useState<ReportSubject | null>(null);
    // 방장이 결정해야 하는 상태면 결정 기한마다 한 번 먼저 묻는다
    if (party?.is_host && party.status === 'WAITING_DECISION' && party.decision_deadline_at !== promptedFor) {
        setPromptedFor(party.decision_deadline_at);
        setAction({ kind: party.total_amount < party.min_order_amount ? 'unmet' : 'confirm' });
    }
    const startAction = (next: DeliveryAction) => {
        setSheet(null);
        setAction(next);
    };
    const openReport = (subject: ReportSubject) => {
        setSheet(null);
        setReport(subject);
    };
    // Stable, so room re-renders do not restart the report sheet's auto-close timer.
    const closeReport = useCallback(() => setReport(null), []);

    const showOrderCta = !!party && ordersAllowed(party) && !party.is_host && myOrders.length === 0;
    const openPaymentSheet = () => {
        setSheet(null);
        setPaymentOpen(true);
    };
    const openSettlement = () => {
        if (!party) return;
        if (party.can_request_payment) router.push(`/web_view/Delivery/${party.id}/Settlement`);
        else {
            setSheet(null);
            setRerequestBlocked(true);
        }
    };
    const voteRow: ChatInputExtraRow = { label: '투표', icon: PostListIcon, color: 'bg-ara_blue', onSelect: () => setVoteOpen(true) };
    const paymentRow: ChatInputExtraRow = { label: '송금 요청', icon: SendIcon, color: 'bg-[#636363]', onSelect: openPaymentSheet };
    const settling = party?.status === 'ORDERED' || party?.status === 'ARRIVED';
    const deliveryRows: ChatInputExtraRow[] | undefined = party && [
        ...(ordersAllowed(party)
            ? [{ label: '주문 등록', icon: PostIcon, color: 'bg-ara_red', onSelect: () => setSheet({ kind: 'order' }) }]
            : []),
        voteRow,
        ...(party.is_host ? [{ ...paymentRow, label: '배달 정산', onSelect: openSettlement, disabled: !settling }] : []),
        { ...paymentRow, label: '정산' },
    ];
    // 배달방은 파티 참여자에게 익명 번호로, 다른 방은 방 멤버에게 청구한다
    const paymentMembers: PaymentMember[] = party
        ? party.members.filter(m => !m.is_mine).map(m => ({ name: m.display_name, target: { anon_number: m.anon_number } }))
        : members.flatMap((m): PaymentMember[] => {
            if (m.is_mine || (m.user && m.user.id === myId) || m.role === 'BLOCKED' || m.role === 'BLOCKER') return [];
            if (m.user) return [{ name: m.user.profile?.nickname ?? m.display_name ?? '', target: { user: m.user.id } }];
            return m.anon_number != null ? [{ name: m.display_name ?? '', target: { anon_number: m.anon_number } }] : [];
        });

    return {
        party, myOrders, sheet, setSheet, action, setAction, voteOpen, setVoteOpen, paymentOpen, setPaymentOpen,
        rerequestBlocked, setRerequestBlocked, startAction, showOrderCta, openPaymentSheet, openSettlement,
        voteRow, paymentRow, deliveryRows, paymentMembers, report, openReport, closeReport,
    };
}

export function useDeliveryPayments({ party, messages, compact }: { party: DeliveryParty | undefined; messages: Message[]; compact: boolean }) {
    const paymentMessage = party?.payment_request != null
        ? messages.find(m => m.message_type === 'PAYMENT_REQUEST' && (m.attachment as ChatPaymentRequest | null)?.id === party.payment_request)
        : undefined;
    // 정산 요청 메시지가 불러온 최근 메시지 밖이면 상태 바가 '정산 대기'로 돌아가지 않게 따로 불러온다
    const unloadedPaymentId = compact && party?.payment_request != null && !paymentMessage ? party.payment_request : null;
    const { data: unloadedPayment } = useQuery({
        queryKey: [...DELIVERY_KEY, 'payment', unloadedPaymentId],
        queryFn: () => fetchPaymentRequest(unloadedPaymentId as number),
        enabled: unloadedPaymentId !== null,
        staleTime: 5_000,
    });
    const payments = messages.flatMap(m => (m.message_type === 'PAYMENT_REQUEST' && m.attachment ? [m.attachment as ChatPaymentRequest] : []));
    if (unloadedPayment) payments.push(unloadedPayment);
    return payments;
}
