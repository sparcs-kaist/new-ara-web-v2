'use client';

import { useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { BottomSheet, Skeleton } from '@/app/web_view/_components';
import { DELIVERY_KEY, useDeliveryParty } from '@/app/web_view/_query';
import { useNow } from '@/app/web_view/hooks/useNow';
import { apiDetail, joinDeliveryParty } from '@/lib/api/delivery';
import { formatWon, isRecruitingOpen, isUrgent } from '@/lib/delivery';
import type { DeliveryParty } from '@/lib/types/delivery';
import { CtaButton } from './BottomCta';
import { DeliveryRoomCardBody } from './DeliveryRoomCard';

export function DeliveryDetailSheet({ partyId, onClose }: { partyId: number | null; onClose: () => void }) {
    const router = useRouter();
    const qc = useQueryClient();
    const [prevPartyId, setPrevPartyId] = useState(partyId);
    // Keeps showing the last room while the sheet slides out.
    const [shownId, setShownId] = useState(partyId);
    const [joinError, setJoinError] = useState<string | null>(null);
    const [joining, setJoining] = useState(false);
    if (partyId !== prevPartyId) {
        setPrevPartyId(partyId);
        if (partyId !== null) {
            setShownId(partyId);
            setJoinError(null);
        }
    }
    const { data: party, isError, error } = useDeliveryParty(shownId);

    const join = async () => {
        if (!party || joining) return;
        setJoining(true);
        setJoinError(null);
        try {
            const joined = await joinDeliveryParty(party.id);
            qc.invalidateQueries({ queryKey: DELIVERY_KEY });
            router.push(`/web_view/Chat/${joined.chat_room}`);
        } catch (e) {
            setJoinError(apiDetail(e));
            qc.invalidateQueries({ queryKey: DELIVERY_KEY });
        } finally {
            setJoining(false);
        }
    };

    return (
        <BottomSheet open={partyId !== null} onClose={onClose} title="배달방">
            {party ? (
                <DeliveryDetailBody
                    party={party}
                    error={joinError}
                    onJoin={join}
                    onOpenChat={() => router.push(`/web_view/Chat/${party.chat_room}`)}
                />
            ) : isError ? (
                <p className="px-5 py-10 text-center text-[14px] text-[#BBBBBB]">{apiDetail(error)}</p>
            ) : (
                <div className="space-y-3 px-5 py-2">
                    <Skeleton className="h-[18px] w-[60%] rounded" />
                    <Skeleton className="h-[14px] w-[85%] rounded" />
                    <Skeleton className="h-[14px] w-[40%] rounded" />
                </div>
            )}
        </BottomSheet>
    );
}

export function DeliveryDetailBody({
    party,
    error,
    onJoin,
    onOpenChat,
}: {
    party: DeliveryParty;
    error: string | null;
    onJoin: () => void;
    onOpenChat: () => void;
}) {
    const now = useNow();
    const open = isRecruitingOpen(party, now);
    const urgent = isUrgent(party, now);
    const full = party.max_participants != null && party.participant_count >= party.max_participants;

    return (
        <div className="flex flex-col gap-[18px] px-5">
            <div data-urgent={urgent || undefined}>
                <div className={`rounded-[15px] bg-white p-4 ${urgent ? '' : 'border-[1.5px] border-ara_red'}`}>
                    <DeliveryRoomCardBody party={party} showStatus={party.is_member} />
                </div>
            </div>

            <div className="h-px bg-[#F0F0F0]" />

            <h3 className="text-[15px] font-bold text-[#333333]">방장 메모</h3>
            <p
                className={`whitespace-pre-wrap break-words rounded-[12px] bg-[#F8F8F8] p-[14px] text-[14px] leading-[1.55] ${party.memo ? 'text-[#636363]' : 'text-[#BBBBBB]'}`}
            >
                {party.memo || '메모가 없어요'}
            </p>
            <dl className="space-y-[11px]">
                <InfoRow label="최소 주문 금액">{formatWon(party.min_order_amount)}</InfoRow>
                <InfoRow label="현재 모인 금액">{formatWon(party.total_amount)}</InfoRow>
                <InfoRow label="최대 인원">
                    {party.max_participants == null ? '제한 없음' : `${party.max_participants}명`}
                </InfoRow>
                {party.host_orders.length > 0 && (
                    <InfoRow label="방장 주문">
                        {party.host_orders.map((o, i) => (
                            <span key={i} className="block">
                                {o.menu_name ? `${o.menu_name} · ${formatWon(o.price)}` : formatWon(o.price)}
                            </span>
                        ))}
                    </InfoRow>
                )}
            </dl>

            <div className="h-px bg-[#F0F0F0]" />

            <h3 className="text-[15px] font-bold text-[#333333]">참여자 {party.participant_count}명</h3>
            <p className="break-keep text-[12px] font-medium leading-[1.5] text-[#636363]">
                참여하면 바로 채팅방으로 들어가고, 주문할 메뉴와 금액은 채팅방에서 입력해요.
            </p>

            {error && <p className="text-[13px] text-ara_red">{error}</p>}
            {/* The render's bottom action bar: a full-width rule over the button. */}
            <div className="-mx-5 mt-1 border-t border-[#F0F0F0] px-5 pt-[18px]">
                {party.is_member ? (
                    <CtaButton onClick={onOpenChat}>채팅방으로 이동</CtaButton>
                ) : open && !full ? (
                    <CtaButton onClick={onJoin}>배달 참여하기</CtaButton>
                ) : (
                    <CtaButton disabled>{open ? '정원이 다 찼어요' : '모집이 마감됐어요'}</CtaButton>
                )}
            </div>
        </div>
    );
}

export function InfoRow({ label, children }: { label: string; children: ReactNode }) {
    return (
        <div className="flex items-baseline justify-between gap-4">
            <dt className="shrink-0 text-[13px] font-medium text-[#BBBBBB]">{label}</dt>
            <dd className="min-w-0 text-right text-[14px] font-medium text-[#333333]">{children}</dd>
        </div>
    );
}
