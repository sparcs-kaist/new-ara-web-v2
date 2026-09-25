'use client';

import { formatWon } from '@/lib/delivery';
import type { DeliveryOrder } from '@/lib/types/delivery';

export function OrderCard({ order, isMe }: { order: DeliveryOrder; isMe: boolean }) {
    const labelColor = order.is_canceled ? (isMe ? 'text-white/70' : 'text-[#BBBBBB]') : isMe ? 'text-white' : 'text-ara_red';
    const strike = order.is_canceled ? ' line-through' : '';
    return (
        <span className="block">
            <span className={`block text-[10px] font-bold ${labelColor}`}>{order.is_canceled ? '취소됨' : '주문'}</span>
            {order.menu_name && <span className={`block text-[14px]${strike}`}>{order.menu_name}</span>}
            <span className={`block text-[16px] font-bold${strike}`}>{formatWon(order.price)}</span>
        </span>
    );
}
