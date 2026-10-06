'use client';

import { useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ConfirmDialog } from '@/app/web_view/_components';
import { DELIVERY_KEY } from '@/app/web_view/_query';
import {
    apiDetail,
    arriveDeliveryParty,
    cancelDeliveryOrder,
    cancelDeliveryParty,
    confirmDeliveryParty,
    extendDeliveryParty,
    kickDeliveryMember,
    leaveDeliveryParty,
} from '@/lib/api/delivery';
import { formatWon, remainingAmount } from '@/lib/delivery';
import type { DeliveryMember, DeliveryOrder, DeliveryParty } from '@/lib/types/delivery';

export type DeliveryAction =
    | { kind: 'confirm' | 'extend' | 'cancel' | 'arrive' | 'unmet' | 'leave' }
    | { kind: 'kick'; member: DeliveryMember }
    | { kind: 'cancelOrder'; order: DeliveryOrder };

const EXTEND_MINUTES = [5, 10, 15, 30];

export function DeliveryActionDialog({
    party,
    action,
    onAction,
    onClose,
    onLeft,
}: {
    party: DeliveryParty;
    action: DeliveryAction;
    onAction: (action: DeliveryAction) => void;
    onClose: () => void;
    onLeft: () => void;
}) {
    const qc = useQueryClient();
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [minutes, setMinutes] = useState(10);

    const run = async (call: () => Promise<unknown>, after = onClose) => {
        setBusy(true);
        setError(null);
        try {
            await call();
            qc.invalidateQueries({ queryKey: DELIVERY_KEY });
            after();
        } catch (e) {
            setError(apiDetail(e));
        } finally {
            setBusy(false);
        }
    };
    const errorLine = error && <p className="mt-3 text-[13px] text-ara_red">{error}</p>;
    const back = { label: '돌아가기', onClick: onClose };

    switch (action.kind) {
        case 'confirm':
            return (
                <ConfirmDialog
                    title="지금 주문할까요?"
                    onClose={onClose}
                    secondary={{ label: '나중에', onClick: onClose }}
                    primary={{ label: '주문하기', disabled: busy, onClick: () => run(() => confirmDeliveryParty(party.id)) }}
                >
                    <Body>주문 후에는 참여자가 주문을 추가하거나 취소할 수 없습니다.</Body>
                    <Rows
                        rows={[
                            ['주문 합계', formatWon(party.total_amount)],
                            ['최소 주문 금액', formatWon(party.min_order_amount)],
                            ['참여자', `${party.participant_count}명`],
                        ]}
                    />
                    {errorLine}
                </ConfirmDialog>
            );
        case 'unmet':
            return (
                <ConfirmDialog
                    title="최소 금액을 못 채웠어요"
                    onClose={onClose}
                    secondary={{ label: '모집 취소', disabled: busy, onClick: () => run(() => cancelDeliveryParty(party.id)) }}
                    primary={{ label: '마감 연장', onClick: () => onAction({ kind: 'extend' }) }}
                >
                    <Body>마감까지 {formatWon(party.total_amount)}이 모였습니다.</Body>
                    <Rows
                        rows={[
                            ['모인 금액', formatWon(party.total_amount)],
                            ['모자라는 금액', formatWon(remainingAmount(party)), true],
                        ]}
                    />
                    <p className="mt-3 rounded-[10px] bg-[#F6F6F6] px-4 py-3 text-[13px] text-[#646464]">
                        최소 금액 미달로 취소할 때는 패널티가 없습니다.
                    </p>
                    {errorLine}
                </ConfirmDialog>
            );
        case 'extend':
            return (
                <ConfirmDialog
                    title="모집을 연장할까요?"
                    onClose={onClose}
                    secondary={{ label: '취소', onClick: onClose }}
                    primary={{
                        label: '연장하기',
                        disabled: busy,
                        onClick: () => run(() => extendDeliveryParty(party.id, minutes)),
                    }}
                >
                    <div className="mt-4 flex gap-2">
                        {EXTEND_MINUTES.map((m) => (
                            <button
                                key={m}
                                type="button"
                                aria-pressed={m === minutes}
                                onClick={() => setMinutes(m)}
                                className={`h-10 flex-1 rounded-[10px] border text-[14px] font-medium ${m === minutes ? 'border-ara_red bg-white text-ara_red' : 'border-transparent bg-[#F6F6F6] text-[#646464]'}`}
                            >
                                {m}분
                            </button>
                        ))}
                    </div>
                    {errorLine}
                </ConfirmDialog>
            );
        case 'cancel': {
            const othersOrdered = party.orders?.some((o) => !o.orderer.is_mine) ?? false;
            // Mirrors the server: no penalty when an unmet room is canceled after the deadline.
            const penalized =
                othersOrdered && !(party.status === 'WAITING_DECISION' && party.total_amount < party.min_order_amount);
            return (
                <ConfirmDialog
                    title="모집을 취소할까요?"
                    onClose={onClose}
                    secondary={back}
                    primary={{ label: '취소하기', disabled: busy, onClick: () => run(() => cancelDeliveryParty(party.id)) }}
                >
                    <Body>{othersOrdered ? '이미 다른 사람이 주문을 넣었습니다.' : '모집을 취소하면 방이 닫힙니다.'}</Body>
                    {penalized && (
                        <p className="mt-3 whitespace-pre-line rounded-[10px] bg-ara_red_most_bright px-4 py-3 text-[13px] leading-5 text-ara_red">
                            {'패널티가 부여됩니다.\n3시간 동안 방을 만들 수 없습니다.'}
                        </p>
                    )}
                    {errorLine}
                </ConfirmDialog>
            );
        }
        case 'arrive':
            return (
                <ConfirmDialog
                    title="도착 알림을 보낼까요?"
                    onClose={onClose}
                    secondary={{ label: '아직이요', onClick: onClose }}
                    primary={{ label: '도착 알리기', disabled: busy, onClick: () => run(() => arriveDeliveryParty(party.id)) }}
                >
                    <Body>참여자 전원에게 알림이 가고, 채팅방에 도착 기록이 남습니다.</Body>
                    <Rows rows={[['받을 장소', [party.place_name, party.place_detail].filter(Boolean).join(' ')]]} />
                    {errorLine}
                </ConfirmDialog>
            );
        case 'leave':
            return error ? (
                <ConfirmDialog title={error} onClose={onClose} primary={{ label: '확인', onClick: onClose }} />
            ) : (
                <ConfirmDialog
                    title="방을 나갈까요?"
                    onClose={onClose}
                    secondary={back}
                    primary={{ label: '나가기', disabled: busy, onClick: () => run(() => leaveDeliveryParty(party.id), onLeft) }}
                />
            );
        case 'kick':
            return (
                <ConfirmDialog
                    title={`${action.member.display_name}님을 내보낼까요?`}
                    onClose={onClose}
                    secondary={back}
                    primary={{
                        label: '내보내기',
                        disabled: busy,
                        onClick: () => run(() => kickDeliveryMember(party.id, action.member.anon_number)),
                    }}
                >
                    <Body>내보낸 사람은 다시 들어올 수 없고, 주문도 함께 취소돼요.</Body>
                    {errorLine}
                </ConfirmDialog>
            );
        case 'cancelOrder': {
            const { order } = action;
            return (
                <ConfirmDialog
                    title="주문을 취소할까요?"
                    onClose={onClose}
                    secondary={back}
                    primary={{
                        label: '취소하기',
                        disabled: busy,
                        onClick: () => run(() => cancelDeliveryOrder(party.id, order.id)),
                    }}
                >
                    <Body>{order.menu_name ? `${order.menu_name} · ${formatWon(order.price)}` : formatWon(order.price)}</Body>
                    {errorLine}
                </ConfirmDialog>
            );
        }
    }
}

export function Body({ children }: { children: ReactNode }) {
    return <p className="mt-2 break-keep text-[14px] leading-5 text-[#646464]">{children}</p>;
}

export function Rows({ rows }: { rows: [label: string, value: string, red?: boolean][] }) {
    return (
        <dl className="mt-4 space-y-2 rounded-[10px] bg-[#F6F6F6] px-4 py-3">
            {rows.map(([label, value, red]) => (
                <div key={label} className="flex items-center justify-between gap-3">
                    <dt className="shrink-0 text-[13px] text-[#646464]">{label}</dt>
                    <dd className={`min-w-0 text-right text-[14px] font-semibold ${red ? 'text-ara_red' : 'text-black'}`}>
                        {value}
                    </dd>
                </div>
            ))}
        </dl>
    );
}
