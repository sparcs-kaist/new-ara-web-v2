'use client';

import { useState, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { BottomSheet } from '@/app/web_view/_components';
import { DELIVERY_KEY } from '@/app/web_view/_query';
import { useNow } from '@/app/web_view/hooks/useNow';
import { apiDetail, updateDeliveryParty } from '@/lib/api/delivery';
import { formatWon, orderTotal, ordersAllowed, pad } from '@/lib/delivery';
import type { DeliveryParty, DeliveryStatus } from '@/lib/types/delivery';
import { AnonAvatar } from './AnonAvatar';
import { CtaButton } from './BottomCta';
import { InfoRow } from './DeliveryDetailSheet';
import type { DeliveryAction } from './DeliveryActionDialog';
import { INPUT_CLASS, NumberInput } from './fields';

const STATUS_TEXT: Record<DeliveryStatus, string> = {
    RECRUITING: '모집 중',
    WAITING_DECISION: '모집 마감',
    ORDERED: '주문 확정',
    ARRIVED: '배달 도착',
    SETTLED: '정산 완료',
    CANCELED: '취소됨',
};

function deadlineText(party: DeliveryParty, now: number): string {
    if (party.status !== 'RECRUITING') return STATUS_TEXT[party.status];
    const deadline = new Date(party.deadline_at);
    const left = deadline.getTime() - now;
    if (left <= 0) return '마감 처리 중';
    return `${pad(deadline.getHours())}:${pad(deadline.getMinutes())} (${Math.ceil(left / 60_000)}분 남음)`;
}

export function RoomInfoSheet({
    open,
    party,
    onAction,
    onSettle,
    onClose,
}: {
    open: boolean;
    party: DeliveryParty;
    onAction: (action: DeliveryAction) => void;
    onSettle: () => void;
    onClose: () => void;
}) {
    const now = useNow();
    const [editing, setEditing] = useState(false);
    if (!open && editing) setEditing(false);
    const orders = party.orders ?? [];
    const ordersOpen = ordersAllowed(party);
    // The server refuses a host leave while recruiting; canceling is how the host gets out.
    const hostMustCancel = party.is_host && ordersOpen;

    return (
        <BottomSheet open={open} onClose={onClose} title="방 정보">
            <div className="px-5">
                <dl className="space-y-3">
                    <InfoRow label="식당">{party.store_name}</InfoRow>
                    <InfoRow label="받을 장소">{[party.place_name, party.place_detail].filter(Boolean).join(' ')}</InfoRow>
                    <InfoRow label="최소 주문 금액">{formatWon(party.min_order_amount)}</InfoRow>
                    <InfoRow label="마감">{deadlineText(party, now)}</InfoRow>
                    <InfoRow label="최대 인원">
                        {party.max_participants == null ? '제한 없음' : `${party.max_participants}명`}
                    </InfoRow>
                    {party.order_link && (
                        <InfoRow label="함께주문 링크">
                            <a href={party.order_link} target="_blank" rel="noreferrer" className="block truncate text-ara_blue">
                                {party.order_link}
                            </a>
                        </InfoRow>
                    )}
                </dl>

                <div className="my-5 h-px bg-[#F0F0F0]" />

                {editing ? (
                    <InfoEditForm party={party} onDone={() => setEditing(false)} />
                ) : (
                    <>
                        <div className="flex items-center justify-between">
                            <h3 className="text-[15px] font-semibold text-black">방장 메모</h3>
                            {party.is_host && ordersOpen && (
                                <button type="button" onClick={() => setEditing(true)} className="text-[13px] text-[#646464]">
                                    수정
                                </button>
                            )}
                        </div>
                        <p
                            className={`mt-2 whitespace-pre-wrap break-words rounded-[10px] bg-[#F6F6F6] p-3 text-[14px] ${party.memo ? 'text-[#646464]' : 'text-[#BBBBBB]'}`}
                        >
                            {party.memo || '메모가 없어요'}
                        </p>
                    </>
                )}

                <div className="my-5 h-px bg-[#F0F0F0]" />

                <h3 className="text-[15px] font-semibold text-black">참여자 {party.participant_count}명</h3>
                <ul className="mt-3 space-y-3">
                    {party.members.map((m) => {
                        const memberOrders = orders.filter((o) => o.orderer.anon_number === m.anon_number);
                        return (
                            <li key={m.anon_number} className="flex items-center gap-3">
                                <AnonAvatar size={28} />
                                <span className="min-w-0 flex-1 truncate text-[15px] text-black">
                                    {m.display_name}
                                    {m.is_mine && ' (나)'}
                                </span>
                                <span className="shrink-0 text-[14px] text-[#646464]">
                                    {memberOrders.length ? formatWon(orderTotal(memberOrders)) : '-'}
                                </span>
                            </li>
                        );
                    })}
                </ul>

                {party.is_host && party.status !== 'SETTLED' && party.status !== 'CANCELED' && (
                    <>
                        <div className="my-5 h-px bg-[#F0F0F0]" />
                        <h3 className="text-[15px] font-semibold text-black">방장</h3>
                        <div className="mt-3 space-y-2">
                            {ordersOpen && (
                                <>
                                    <CtaButton
                                        disabled={party.total_amount < party.min_order_amount}
                                        onClick={() => onAction({ kind: 'confirm' })}
                                    >
                                        주문 확정하기
                                    </CtaButton>
                                    <div className="flex gap-2">
                                        <SubButton onClick={() => onAction({ kind: 'extend' })}>모집 연장</SubButton>
                                        <SubButton onClick={() => onAction({ kind: 'cancel' })}>모집 취소</SubButton>
                                    </div>
                                </>
                            )}
                            {party.status === 'ORDERED' && (
                                <CtaButton onClick={() => onAction({ kind: 'arrive' })}>배달 도착 알림</CtaButton>
                            )}
                            {(party.status === 'ORDERED' || party.status === 'ARRIVED') && (
                                <SubButton onClick={onSettle}>배달 정산 요청</SubButton>
                            )}
                        </div>
                    </>
                )}

                <div className="my-5 h-px bg-[#F0F0F0]" />
                <button
                    type="button"
                    onClick={() => onAction({ kind: hostMustCancel ? 'cancel' : 'leave' })}
                    className="text-[16px] font-semibold text-ara_red"
                >
                    {hostMustCancel ? '모집 취소' : '방 나가기'}
                </button>
            </div>
        </BottomSheet>
    );
}

function SubButton(props: ButtonHTMLAttributes<HTMLButtonElement>) {
    return (
        <button
            type="button"
            {...props}
            className="h-12 w-full flex-1 rounded-[10px] bg-[#F6F6F6] text-[15px] font-medium text-black disabled:text-[#BBBBBB]"
        />
    );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
    return (
        <div>
            <p className="mb-1 text-[13px] text-[#646464]">{label}</p>
            {children}
        </div>
    );
}

function InfoEditForm({ party, onDone }: { party: DeliveryParty; onDone: () => void }) {
    const qc = useQueryClient();
    const [form, setForm] = useState({
        place_detail: party.place_detail,
        max_participants: party.max_participants == null ? '' : String(party.max_participants),
        memo: party.memo,
        order_link: party.order_link,
    });
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const set = (field: keyof typeof form) => (value: string) => setForm((f) => ({ ...f, [field]: value }));

    const save = async () => {
        setSaving(true);
        setError(null);
        try {
            await updateDeliveryParty(party.id, {
                place_detail: form.place_detail.trim(),
                max_participants: form.max_participants ? Number(form.max_participants) : null,
                memo: form.memo.trim(),
                order_link: form.order_link.trim(),
            });
            qc.invalidateQueries({ queryKey: DELIVERY_KEY });
            onDone();
        } catch (e) {
            setError(apiDetail(e));
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-3">
            <h3 className="text-[15px] font-semibold text-black">방 정보 수정</h3>
            <Field label="상세 위치">
                <input
                    value={form.place_detail}
                    onChange={(e) => set('place_detail')(e.target.value)}
                    placeholder="예) 1층 로비"
                    maxLength={100}
                    className={INPUT_CLASS}
                />
            </Field>
            <Field label="최대 인원">
                <NumberInput value={form.max_participants} onChange={set('max_participants')} placeholder="제한 없음" unit="명" />
            </Field>
            <Field label="방장 메모">
                <textarea
                    value={form.memo}
                    onChange={(e) => set('memo')(e.target.value)}
                    placeholder="예) 희망관 1층 로비에서 받아가요"
                    rows={3}
                    className="w-full resize-none rounded-[10px] bg-[#F6F6F6] px-4 py-3 text-[15px] text-black placeholder:text-[#BBBBBB] focus:outline-none"
                />
            </Field>
            <Field label="함께주문 링크">
                <input
                    value={form.order_link}
                    onChange={(e) => set('order_link')(e.target.value)}
                    placeholder="배민 함께주문 링크"
                    inputMode="url"
                    autoCapitalize="none"
                    className={INPUT_CLASS}
                />
            </Field>
            {error && <p className="text-[13px] text-ara_red">{error}</p>}
            <div className="flex gap-2">
                <SubButton onClick={onDone}>취소</SubButton>
                <button
                    type="button"
                    data-press="strong"
                    disabled={saving}
                    onClick={save}
                    className="h-12 flex-1 rounded-[10px] bg-ara_red text-[15px] font-medium text-white"
                >
                    저장
                </button>
            </div>
        </div>
    );
}
