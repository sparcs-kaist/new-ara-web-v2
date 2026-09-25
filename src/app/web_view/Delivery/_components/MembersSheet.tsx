'use client';

import { BottomSheet } from '@/app/web_view/_components';
import { formatWon, orderTotal } from '@/lib/delivery';
import type { DeliveryMember, DeliveryParty } from '@/lib/types/delivery';
import { AnonAvatar } from './AnonAvatar';

export function MembersSheet({
    open,
    party,
    onKick,
    onClose,
}: {
    open: boolean;
    party: DeliveryParty;
    onKick: (member: DeliveryMember) => void;
    onClose: () => void;
}) {
    const orders = party.orders ?? [];

    return (
        <BottomSheet open={open} onClose={onClose} title={`참여자 ${party.participant_count}명`}>
            <ul className="px-5">
                {party.members.map((m) => {
                    const memberOrders = orders.filter((o) => o.orderer.anon_number === m.anon_number);
                    const menus = memberOrders
                        .map((o) => o.menu_name)
                        .filter(Boolean)
                        .join(', ');
                    return (
                        <li key={m.anon_number} className="flex items-center gap-3 py-2">
                            <AnonAvatar size={36} />
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-[6px]">
                                    <span className="truncate text-[15px] font-semibold text-black">{m.display_name}</span>
                                    {m.is_mine && (
                                        <span className="shrink-0 rounded-[6px] bg-[#F6F6F6] px-[6px] text-[11px] leading-[18px] text-[#646464]">
                                            나
                                        </span>
                                    )}
                                </div>
                                {menus && <p className="truncate text-[12px] text-[#646464]">{menus}</p>}
                            </div>
                            <div className="flex shrink-0 flex-col items-end">
                                <span className="text-[15px] font-semibold text-black">
                                    {memberOrders.length ? formatWon(orderTotal(memberOrders)) : '-'}
                                </span>
                                {party.is_host && m.role !== 'OWNER' && (
                                    <button type="button" onClick={() => onKick(m)} className="text-[12px] text-[#646464]">
                                        내보내기
                                    </button>
                                )}
                            </div>
                        </li>
                    );
                })}
            </ul>
            <p className="mx-5 mt-3 border-t border-[#F0F0F0] pt-4 text-center text-[12px] text-[#BBBBBB]">
                방 안에서는 서로 구분되는 익명으로만 보여요
            </p>
        </BottomSheet>
    );
}
