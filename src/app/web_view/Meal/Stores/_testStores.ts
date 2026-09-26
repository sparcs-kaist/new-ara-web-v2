// TEMPORARY UI test data for the two rollout users while the stores table is empty — delete this file and its
// uses in _query/store.ts once real stores exist.
import { WEEKDAYS, type StoreDetail, type StoreHours, type StoreMenu, type StoreSummary } from '@/lib/types/store';

const everyDay = (...ranges: [string, string][]): StoreHours =>
    Object.fromEntries(WEEKDAYS.map((day) => [day, ranges.map(([open, close]) => ({ open, close }))]));

const menu = (id: number, name: string, price: number, order: number, category: number | null, isSignature = false): StoreMenu => ({
    id,
    category,
    name,
    price,
    description: '',
    photo: null,
    is_signature: isSignature,
    is_sold_out: false,
    order,
});

const BASE = [
    {
        id: 900001,
        name: '오니기리와 이규동',
        category: '일식',
        hours: everyDay(['10:30', '20:00']),
        categories: [
            { id: 1, name: '덮밥', order: 0 },
            { id: 2, name: '오니기리', order: 1 },
        ],
        menus: [menu(1, '트리플 치즈 규동', 6800, 0, 1, true), menu(2, '후리가케 오니기리', 1000, 1, 2)],
    },
    {
        id: 900002,
        name: '별리달리',
        category: '한식/분식',
        hours: everyDay(['11:00', '14:00'], ['17:00', '20:00']),
        categories: [{ id: 3, name: '도시락', order: 0 }],
        menus: [menu(3, '추억의 도시락', 5000, 0, 3)],
    },
];

function openFields(hours: StoreHours, now = new Date()): Pick<StoreSummary, 'is_open' | 'open_note' | 'open_state' | 'today_hours'> {
    const kst = new Date(now.getTime() + 9 * 3_600_000);
    const ranges = hours[WEEKDAYS[(kst.getUTCDay() + 6) % 7]] ?? [];
    const hm = `${String(kst.getUTCHours()).padStart(2, '0')}:${String(kst.getUTCMinutes()).padStart(2, '0')}`;
    const todayHours = ranges.length ? ranges.map((r) => `${r.open}–${r.close}`).join(', ') : null;
    const current = ranges.find((r) => r.open <= hm && hm < r.close);
    const next = ranges.find((r) => hm < r.open);
    if (current) return { is_open: true, open_note: `${current.close}까지 영업`, open_state: { kind: 'OPEN', time: current.close, reason: null, until: null }, today_hours: todayHours };
    if (next) return { is_open: false, open_note: `${next.open} 영업 시작`, open_state: { kind: 'BEFORE_OPEN', time: next.open, reason: null, until: null }, today_hours: todayHours };
    if (!ranges.length) return { is_open: false, open_note: '오늘 휴무', open_state: { kind: 'CLOSED_TODAY', time: null, reason: null, until: null }, today_hours: null };
    return { is_open: false, open_note: '영업 종료', open_state: { kind: 'CLOSED', time: null, reason: null, until: null }, today_hours: todayHours };
}

function detail({ id, name, category, hours, categories, menus }: (typeof BASE)[number]): StoreDetail {
    return {
        id,
        name,
        category,
        zone: 'NORTH',
        location: '카이마루 (N11)',
        hours,
        hours_note: '',
        ...openFields(hours),
        signature_menus: menus.filter((m) => m.is_signature).map((m) => m.name),
        cover: null,
        restaurant: null,
        is_active: true,
        intro: '',
        phone: '',
        link: '',
        categories,
        menus,
        notices: [],
        events: [],
        is_staff: false,
    };
}

export const isTestStoreId = (id: number) => BASE.some((s) => s.id === id);

export const testStoreDetail = (id: number) => detail(BASE.find((s) => s.id === id) ?? BASE[0]);

export function testStores(q: string): StoreSummary[] {
    const term = q.trim();
    return BASE.filter((s) => !term || [s.name, s.category, ...s.menus.map((m) => m.name)].some((text) => text.includes(term))).map(detail);
}
