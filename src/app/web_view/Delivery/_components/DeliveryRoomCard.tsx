'use client';

import { ClockIcon, MemberIcon, PinIcon, Skeleton } from '@/app/web_view/_components';
import { useNow } from '@/app/web_view/hooks/useNow';
import { formatRemaining, formatWon, isRecruitingOpen, isUrgent, statusLabel } from '@/lib/delivery';
import type { DeliveryPartySummary } from '@/lib/types/delivery';

/** `showStatus` (내 배달): a status chip, and no countdown once recruiting is over. */
export function DeliveryRoomCardBody({ party, showStatus = false }: { party: DeliveryPartySummary; showStatus?: boolean }) {
    const now = useNow();
    const open = isRecruitingOpen(party, now);
    const min = party.min_order_amount;
    const progress = min > 0 ? Math.min(100, (party.total_amount / min) * 100) : 100;

    return (
        <div className="flex flex-col gap-[11px]">
            <div className="flex items-center gap-2">
                <span className="min-w-0 flex-1 truncate text-[16px] font-bold text-[#333333]">{party.store_name}</span>
                {showStatus && (
                    <span
                        className={`shrink-0 rounded-[6px] px-[6px] text-[11px] font-medium leading-[18px] ${open ? 'bg-ara_red_most_bright text-ara_red' : 'bg-[#F6F6F6] text-[#646464]'}`}
                    >
                        {statusLabel(party, now)}
                    </span>
                )}
                <span className="flex shrink-0 items-center text-[13px] font-medium text-[#636363]">
                    <MemberIcon size={18} />
                    {party.max_participants == null
                        ? party.participant_count
                        : `${party.participant_count}/${party.max_participants}`}
                </span>
            </div>
            <div className="flex items-center gap-[5px] text-[13px] font-medium text-[#636363]">
                <PinIcon className="text-[#BBBBBB]" />
                <span className="min-w-0 truncate">
                    배달 장소 : {party.place_name}
                    {party.place_detail && ` ${party.place_detail}`}
                </span>
            </div>
            <div className="h-[7px] overflow-hidden rounded-[4px] bg-[#F0F0F0]">
                <div className="h-full rounded-[4px] bg-gradient-to-r from-[#FF8A6B] to-ara_red" style={{ width: `${progress}%` }} />
            </div>
            <div className="flex min-h-7 items-center">
                {(open || !showStatus) && (
                    <span className="flex h-7 items-center gap-[5px] rounded-[7px] bg-ara_red_most_bright pl-2 pr-[10px] text-[13px] font-bold text-ara_red">
                        <ClockIcon />
                        {open ? formatRemaining(party.deadline_at, now) : '마감'}
                    </span>
                )}
                <span className="ml-auto text-[13px] font-bold text-[#333333]">
                    {party.total_amount.toLocaleString('ko-KR')} / {formatWon(min)}
                </span>
            </div>
        </div>
    );
}

export function DeliveryRoomCard({
    party,
    showStatus,
    onPress,
}: {
    party: DeliveryPartySummary;
    showStatus?: boolean;
    onPress: () => void;
}) {
    const now = useNow();
    const urgent = isUrgent(party, now);
    return (
        // The glow sits on a wrapper: the press ripple paints the button's own background-image.
        <div data-urgent={urgent || undefined}>
            <button
                type="button"
                onClick={onPress}
                // 15.5px inside the 1.5px ring keeps the content where the 1px-border card has it, so nothing shifts at 3:00.
                className={`block w-full rounded-[15px] bg-white text-left ${urgent ? 'p-[15.5px]' : 'border border-[#F0F0F0] p-4'}`}
            >
                <DeliveryRoomCardBody party={party} showStatus={showStatus} />
            </button>
        </div>
    );
}

export function DeliveryRoomCardSkeleton() {
    return (
        <div className="flex flex-col gap-[11px] rounded-[15px] border border-[#F0F0F0] p-4">
            <Skeleton className="h-[18px] w-[55%] rounded" />
            <Skeleton className="h-[14px] w-[45%] rounded" />
            <Skeleton className="h-[7px] w-full rounded-[4px]" />
            <div className="flex items-center justify-between">
                <Skeleton className="h-7 w-[64px] rounded-[7px]" />
                <Skeleton className="h-[18px] w-[40%] rounded" />
            </div>
        </div>
    );
}
