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
            { id: 4, name: '우동', order: 2 },
            { id: 5, name: '사이드', order: 3 },
            { id: 6, name: '음료', order: 4 },
        ],
        menus: [
            menu(1, '트리플 치즈 규동', 6800, 0, 1, true),
            menu(4, '규동', 5800, 1, 1),
            menu(5, '파 듬뿍 규동', 6300, 2, 1),
            menu(6, '김치 규동', 6300, 3, 1),
            menu(7, '가라아게동', 6500, 4, 1),
            menu(8, '연어동', 8900, 5, 1),
            menu(9, '차슈동', 7200, 6, 1),
            menu(2, '후리가케 오니기리', 1000, 7, 2),
            menu(10, '참치마요 오니기리', 1800, 8, 2),
            menu(11, '명란 오니기리', 2000, 9, 2),
            menu(12, '연어 오니기리', 2200, 10, 2),
            menu(13, '스팸 오니기리', 2000, 11, 2),
            menu(14, '불고기 오니기리', 2200, 12, 2),
            menu(15, '가케 우동', 5000, 13, 4),
            menu(16, '카레 우동', 6500, 14, 4),
            menu(17, '냉우동', 6000, 15, 4),
            menu(18, '미소된장국', 1500, 16, 5),
            menu(19, '가라아게 (5조각)', 4000, 17, 5),
            menu(20, '에다마메', 3000, 18, 5),
            menu(21, '콜라', 2000, 19, 6),
            menu(22, '사이다', 2000, 20, 6),
            menu(23, '녹차', 1500, 21, 6),
        ],
    },
    {
        id: 900002,
        name: '별리달리',
        category: '한식/분식',
        hours: everyDay(['11:00', '14:00'], ['17:00', '20:00']),
        categories: [
            { id: 3, name: '도시락', order: 0 },
            { id: 7, name: '분식', order: 1 },
            { id: 8, name: '음료', order: 2 },
        ],
        menus: [
            menu(3, '추억의 도시락', 5000, 0, 3, true),
            menu(24, '제육 도시락', 6000, 1, 3),
            menu(25, '돈까스 도시락', 6500, 2, 3),
            menu(26, '치킨마요 도시락', 5500, 3, 3),
            menu(27, '떡볶이', 4000, 4, 7),
            menu(28, '김밥', 3000, 5, 7),
            menu(29, '라볶이', 5000, 6, 7),
            menu(30, '순대', 4000, 7, 7),
            menu(31, '어묵', 3000, 8, 7),
            menu(32, '식혜', 1500, 9, 8),
            menu(33, '콜라', 2000, 10, 8),
        ],
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
