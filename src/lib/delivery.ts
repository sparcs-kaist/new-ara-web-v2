import type { DeliveryPartySummary } from '@/lib/types/delivery';

// status lags deadline_at by up to a minute (the sweep runs every minute), so the deadline decides.
export function isRecruitingOpen(p: DeliveryPartySummary, now = Date.now()): boolean {
    return p.status === 'RECRUITING' && new Date(p.deadline_at).getTime() > now;
}

export function remainingAmount(p: DeliveryPartySummary): number {
    return Math.max(0, p.min_order_amount - p.total_amount);
}

export function formatWon(n: number): string {
    return `${n.toLocaleString('ko-KR')}원`;
}

const pad = (n: number) => String(n).padStart(2, '0');

export function formatRemaining(deadlineAt: string, now: number): string {
    const total = Math.floor((new Date(deadlineAt).getTime() - now) / 1000);
    if (total <= 0) return '마감';
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

export function isPenaltyActive(until: string | null | undefined): until is string {
    return !!until && new Date(until).getTime() > Date.now();
}

// The server's 403 wording, built from GET penalty's `until` (UTC) in the device's time zone.
export function penaltyMessage(until: string): string {
    const d = new Date(until);
    return `${d.getMonth() + 1}월 ${d.getDate()}일 ${pad(d.getHours())}:${pad(d.getMinutes())}까지 함께 배달 방을 만들 수 없어요.`;
}
