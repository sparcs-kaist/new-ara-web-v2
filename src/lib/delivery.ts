import type { DeliveryOrder, DeliveryPartySummary, DeliveryStatus } from '@/lib/types/delivery';

// status lags deadline_at by up to a minute (the sweep runs every minute), so the deadline decides.
export function isRecruitingOpen(p: DeliveryPartySummary, now = Date.now()): boolean {
    return p.status === 'RECRUITING' && new Date(p.deadline_at).getTime() > now;
}

// Whole seconds like the countdown chip: the glow starts on the tick it reads 03:00 and stops when it reads 마감.
export function isUrgent(p: DeliveryPartySummary, now: number): boolean {
    const seconds = Math.floor((new Date(p.deadline_at).getTime() - now) / 1000);
    return p.status === 'RECRUITING' && seconds > 0 && seconds <= 180;
}

const STATUS_LABELS: Record<DeliveryStatus, string> = {
    RECRUITING: '모집 중',
    WAITING_DECISION: '결정 대기',
    ORDERED: '주문 확정',
    ARRIVED: '배달 도착',
    SETTLED: '정산 완료',
    CANCELED: '취소됨',
};

// A RECRUITING room past its deadline is only waiting for the sweep, so it already reads 결정 대기.
export function statusLabel(p: DeliveryPartySummary, now: number): string {
    return isRecruitingOpen(p, now) ? STATUS_LABELS.RECRUITING : STATUS_LABELS[p.status === 'RECRUITING' ? 'WAITING_DECISION' : p.status];
}

// RECRUITING past its deadline still takes orders until the sweep closes it.
export function ordersAllowed(p: Pick<DeliveryPartySummary, 'status'>): boolean {
    return p.status === 'RECRUITING' || p.status === 'WAITING_DECISION';
}

export function orderTotal(orders: DeliveryOrder[]): number {
    return orders.reduce((sum, o) => sum + o.price, 0);
}

export function remainingAmount(p: DeliveryPartySummary): number {
    return Math.max(0, p.min_order_amount - p.total_amount);
}

export function formatWon(n: number): string {
    return `${n.toLocaleString('ko-KR')}원`;
}

export const pad = (n: number) => String(n).padStart(2, '0');

// 이/가 follows the last syllable's final consonant; a trailing number is read aloud (2 이, 4 사, 5 오, 9 구 end open).
export function withSubject(name: string): string {
    const c = name.charCodeAt(name.length - 1);
    const open = c >= 0xac00 && c <= 0xd7a3 ? (c - 0xac00) % 28 === 0 : /[2459]$/.test(name);
    return `${name}${open ? '가' : '이'}`;
}

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

// Best-effort public account formats, in the bank picker's order; a bank without prefixes is told apart by length alone.
const BANK_FORMATS: [bank: string, prefixes: string[], lengths: number[]][] = [
    ['토스뱅크', ['1000'], [12]],
    ['카카오뱅크', ['3333'], [13]],
    ['국민은행', [], [12, 14]],
    ['신한은행', ['110', '140'], [12]],
    ['우리은행', ['1002', '1005', '1006'], [13]],
    ['하나은행', [], [14]],
    ['농협은행', ['301', '302', '312', '351', '352'], [13]],
    ['기업은행', [], [14]],
    ['새마을금고', ['9002', '9003', '9004'], [13]],
    ['케이뱅크', ['100'], [12]],
];

export function suggestBanks(accountNumber: string): string[] {
    const digits = accountNumber.replace(/\D/g, '');
    if (digits.length < 3) return [];
    const banks = BANK_FORMATS.filter(([, prefixes, lengths]) =>
        prefixes.length
            ? digits.length <= Math.max(...lengths) && prefixes.some((p) => p.startsWith(digits.slice(0, p.length)))
            : lengths.some((n) => n === digits.length || (n === 14 && digits.length === 13)),
    ).map(([bank]) => bank);
    return banks.length <= 3 ? banks : [];
}

export const hasBankPrefix = (bank: string) => BANK_FORMATS.some(([name, prefixes]) => name === bank && prefixes.length > 0);
