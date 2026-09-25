'use client';

import { ClockIcon, MemberIcon, PinIcon, Skeleton } from '@/app/web_view/_components';
import { useNow } from '@/app/web_view/hooks/useNow';
import { formatRemaining, formatWon, isRecruitingOpen } from '@/lib/delivery';
import type { DeliveryPartySummary } from '@/lib/types/delivery';

/** Card contents without the frame; the detail sheet wraps it in its own border. */
export function DeliveryRoomCardBody({ party }: { party: DeliveryPartySummary }) {
    const now = useNow();
    const open = isRecruitingOpen(party, now);
    const min = party.min_order_amount;
    const progress = min > 0 ? Math.min(100, (party.total_amount / min) * 100) : 100;

    return (
        <div className="flex flex-col gap-[11px]">
            <div className="flex items-center gap-2">
                <span className="min-w-0 flex-1 truncate text-[16px] font-semibold text-black">{party.store_name}</span>
                <span className="flex shrink-0 items-center text-[13px] text-[#646464]">
                    <MemberIcon size={18} />
                    {party.max_participants == null
                        ? party.participant_count
                        : `${party.participant_count}/${party.max_participants}`}
                </span>
            </div>
            <div className="flex items-center gap-[5px] text-[13px] text-[#646464]">
                <PinIcon className="text-[#BBBBBB]" />
                <span className="min-w-0 truncate">
                    배달 장소 : {party.place_name}
                    {party.place_detail && ` ${party.place_detail}`}
                </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-[#F0F0F0]">
                <div className="h-full rounded-full bg-ara_red" style={{ width: `${progress}%` }} />
            </div>
            <div className="flex items-center justify-between">
                <span className="flex h-7 items-center gap-[5px] rounded-[8px] bg-ara_red_most_bright px-2 text-[13px] font-semibold text-ara_red">
                    <ClockIcon />
                    {open ? formatRemaining(party.deadline_at, now) : '마감'}
                </span>
                <span className="text-[15px] font-semibold text-black">
                    {formatWon(party.total_amount)} / {formatWon(min)}
                </span>
            </div>
        </div>
    );
}

export function DeliveryRoomCard({ party, onPress }: { party: DeliveryPartySummary; onPress: () => void }) {
    return (
        <button
            type="button"
            onClick={onPress}
            className="block w-full rounded-[15px] border border-[#F0F0F0] bg-white p-4 text-left"
        >
            <DeliveryRoomCardBody party={party} />
        </button>
    );
}

export function DeliveryRoomCardSkeleton() {
    return (
        <div className="flex flex-col gap-[11px] rounded-[15px] border border-[#F0F0F0] p-4">
            <Skeleton className="h-[18px] w-[55%] rounded" />
            <Skeleton className="h-[14px] w-[45%] rounded" />
            <Skeleton className="h-2 w-full rounded-full" />
            <div className="flex items-center justify-between">
                <Skeleton className="h-7 w-[64px] rounded-[8px]" />
                <Skeleton className="h-[18px] w-[40%] rounded" />
            </div>
        </div>
    );
}
