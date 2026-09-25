'use client';

import { InformationIcon } from '@/app/web_view/_components';
import { formatWon } from '@/lib/delivery';
import type { DeliveryMember, DeliveryOrder } from '@/lib/types/delivery';

// Mirrors the server: every orderer, the host included, owes their orders plus ceil(fee / orderers); the host is not charged.
function splitByOrderer(orders: DeliveryOrder[], fee: number) {
    const rows = new Map<number, { orderer: DeliveryMember; subtotal: number }>();
    for (const o of orders) {
        const row = rows.get(o.orderer.anon_number) ?? { orderer: o.orderer, subtotal: 0 };
        row.subtotal += o.price;
        rows.set(o.orderer.anon_number, row);
    }
    const share = rows.size ? Math.ceil(fee / rows.size) : 0;
    return { rows: [...rows.values()].sort((a, b) => a.orderer.anon_number - b.orderer.anon_number), share };
}

const num = (n: number) => n.toLocaleString('ko-KR');

export function SettlementTable({ orders, fee }: { orders: DeliveryOrder[]; fee: number }) {
    const { rows, share } = splitByOrderer(orders, fee);
    const total = rows.reduce((sum, r) => (r.orderer.role === 'OWNER' ? sum : sum + r.subtotal + share), 0);

    return (
        <section>
            <h2 className="mb-2 text-[15px] font-semibold text-black">참여자별 청구 금액</h2>
            <table className="w-full table-fixed text-right">
                <thead>
                    <tr className="text-[12px] text-[#BBBBBB]">
                        <th className="text-left font-normal">
                            <span className="sr-only">참여자</span>
                        </th>
                        <th className="w-16 font-normal">주문</th>
                        <th className="w-16 font-normal">배송비</th>
                        <th className="w-[72px] font-normal">청구</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map(({ orderer, subtotal }) => {
                        const host = orderer.role === 'OWNER';
                        const grey = host ? '' : 'text-[#646464]';
                        return (
                            <tr key={orderer.anon_number} className={host ? 'text-[#BBBBBB]' : 'text-black'}>
                                <td className="truncate py-[10px] text-left text-[15px]">
                                    {orderer.display_name}
                                    {orderer.is_mine && ' (나)'}
                                </td>
                                <td className={`text-[14px] ${grey}`}>{num(subtotal)}</td>
                                <td className={`text-[14px] ${grey}`}>{num(share)}</td>
                                <td className="text-[15px] font-bold">{host ? '-' : num(subtotal + share)}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
            <div className="mt-3 flex items-center justify-between border-t border-[#F0F0F0] pt-4">
                <span className="text-[15px] font-semibold text-black">총 청구 금액</span>
                <span className="text-[18px] font-bold text-ara_red">{formatWon(total)}</span>
            </div>
            <p className="mt-3 flex items-center gap-1 text-[12px] text-[#646464]">
                <InformationIcon size={14} />
                청구 금액은 사람마다 다릅니다. 배송비는 인원수로 나눕니다.
            </p>
        </section>
    );
}
