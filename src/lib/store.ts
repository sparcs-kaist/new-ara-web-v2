import { pad } from '@/lib/delivery';
import { WEEKDAYS, WEEKDAY_LABELS, type StoreEvent, type StoreHours, type StoreHoursRange, type StoreMenu, type StoreSummary, type Weekday } from '@/lib/types/store';

export type WeekHours = Record<Weekday, StoreHoursRange[]>;

export const storeLine = ({ category, location }: Pick<StoreSummary, 'category' | 'location'>) => [category, location].filter(Boolean).join(' · ');

export const normalizeHours = (hours: StoreHours | null | undefined): WeekHours =>
    Object.fromEntries(WEEKDAYS.map((d) => [d, (hours?.[d] ?? []).map((r) => ({ open: r.open, close: r.close }))])) as WeekHours;

export function hoursSummary(hours: StoreHours | null | undefined): string {
    const week = normalizeHours(hours);
    const off = WEEKDAYS.filter((d) => week[d].length === 0);
    if (off.length === WEEKDAYS.length) return '미설정';
    return off.length ? `요일별 설정 · ${off.map((d) => WEEKDAY_LABELS[d]).join('·')} 휴무` : '요일별 설정';
}

export function validateHours(week: WeekHours): Partial<Record<Weekday, string>> {
    const errors: Partial<Record<Weekday, string>> = {};
    for (const d of WEEKDAYS) {
        const ranges = week[d];
        const sorted = [...ranges].sort((a, b) => a.open.localeCompare(b.open));
        if (ranges.some((r) => !r.open || !r.close)) errors[d] = '시작과 종료 시간을 모두 입력해 주세요';
        else if (ranges.some((r) => r.open >= r.close)) errors[d] = '종료 시간은 시작 시간보다 늦어야 해요';
        else if (sorted.some((r, i) => i > 0 && sorted[i - 1].close > r.open)) errors[d] = '시간이 서로 겹쳐요';
    }
    return errors;
}

const KST_OFFSET_MS = 9 * 3_600_000;

// KST wall-clock parts whatever the device timezone is.
export function kstParts(iso: string) {
    const d = new Date(new Date(iso).getTime() + KST_OFFSET_MS);
    return { y: d.getUTCFullYear(), m: d.getUTCMonth() + 1, d: d.getUTCDate(), hh: d.getUTCHours(), mm: d.getUTCMinutes() };
}

export const kstDate = (iso: string) => {
    const p = kstParts(iso);
    return `${p.y}-${pad(p.m)}-${pad(p.d)}`;
};
export const todayKst = () => kstDate(new Date().toISOString());
export const kstStartIso = (date: string) => (date === todayKst() ? new Date().toISOString() : `${date}T00:00:00+09:00`);
export const kstEndIso = (date: string) => `${date}T23:59:59+09:00`;

const startMs = (e: StoreEvent) => new Date(e.starts_at).getTime();
export const isEventActive = (e: StoreEvent, now: number) => startMs(e) <= now && (e.ends_at === null || new Date(e.ends_at).getTime() > now);
export const isEventFuture = (e: StoreEvent, now: number) => startMs(e) > now;
export const openEndedClosure = (events: StoreEvent[], now: number) => events.find((e) => e.kind === 'CLOSED' && e.ends_at === null && startMs(e) <= now);

export const EVENT_KIND_LABELS: Record<StoreEvent['kind'], string> = { CLOSED: '임시 휴무', OPEN: '임시 영업' };

export function eventsSummary(events: StoreEvent[], now: number): string {
    const active = events.filter((e) => isEventActive(e, now));
    const future = events.filter((e) => isEventFuture(e, now));
    const parts: string[] = [];
    if (active.length) {
        const oneKind = active.every((e) => e.kind === active[0].kind);
        parts.push(`${oneKind ? `${EVENT_KIND_LABELS[active[0].kind]} ` : ''}${active.length}건 진행 중`);
    }
    if (future.length) parts.push(`예정 ${future.length}건`);
    return parts.length ? parts.join(' · ') : '없음';
}

const monthDay = (p: { y: number; m: number; d: number }, withYear: boolean) => `${withYear ? `${p.y}년 ` : ''}${p.m}월 ${p.d}일`;

export function eventPeriod(e: StoreEvent, now = Date.now()): string {
    const s = kstParts(e.starts_at);
    const start = monthDay(s, s.y !== kstParts(new Date(now).toISOString()).y);
    const time = e.kind === 'OPEN' && e.open && e.close ? `${e.open} – ${e.close}` : '';
    if (e.ends_at === null) return [`${start}부터 · ${e.kind === 'OPEN' ? '다시 닫을 때까지' : '다시 열 때까지'}`, time].filter(Boolean).join(' · ');
    const en = kstParts(e.ends_at);
    const sameDay = s.y === en.y && s.m === en.m && s.d === en.d;
    if (sameDay) return time ? `${start} ${time}` : start;
    const range = `${start} – ${monthDay(en, en.y !== s.y)}`;
    return time ? `${range} · ${time}` : range;
}

export function menusSummary(menus: StoreMenu[]): string {
    if (menus.length === 0) return '없음';
    const sold = menus.filter((m) => m.is_sold_out).length;
    const signature = menus.filter((m) => m.is_signature).length;
    return [`${menus.length}개`, sold ? `품절 ${sold}개` : '', signature ? `대표 ${signature}개` : ''].filter(Boolean).join(' · ');
}
