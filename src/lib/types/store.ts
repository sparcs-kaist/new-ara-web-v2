export type Zone = 'EAST' | 'WEST' | 'NORTH';

export const ZONE_LABELS: Record<Zone, string> = { EAST: '동측', WEST: '서측', NORTH: '북측' };

export type Weekday = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

export const WEEKDAYS: Weekday[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

export const WEEKDAY_LABELS: Record<Weekday, string> = { mon: '월', tue: '화', wed: '수', thu: '목', fri: '금', sat: '토', sun: '일' };

export interface StoreHoursRange {
    open: string;
    close: string;
}

export type StoreHours = Partial<Record<Weekday, StoreHoursRange[]>>;

export type StoreOpenKind = 'OPEN' | 'TEMP_OPEN' | 'BEFORE_OPEN' | 'CLOSED' | 'CLOSED_TODAY' | 'TEMP_CLOSED';

export interface StoreOpenState {
    kind: StoreOpenKind;
    time: string | null;
    reason: string | null;
    until: string | null;
}

export interface StoreSummary {
    id: number;
    name: string;
    category: string;
    zone: Zone;
    location: string;
    hours: StoreHours;
    hours_note: string;
    is_open: boolean;
    open_note: string | null;
    open_state: StoreOpenState;
    today_hours: string | null;
    signature_menus: string[];
    cover: string | null;
    restaurant: number | null;
    is_active: boolean;
}

export interface StoreMenu {
    id: number;
    section: string;
    name: string;
    price: number;
    description: string;
    photo: string | null;
    is_signature: boolean;
    is_sold_out: boolean;
    order: number;
}

export interface StoreNotice {
    id: number;
    title: string;
    body: string;
    starts_at: string | null;
    ends_at: string | null;
    created_at: string;
}

export interface StoreEvent {
    id: number;
    kind: 'CLOSED' | 'OPEN';
    starts_at: string;
    ends_at: string | null;
    reason: string;
    open: string | null;
    close: string | null;
}

export interface StoreDetail extends StoreSummary {
    intro: string;
    phone: string;
    link: string;
    menus: StoreMenu[];
    notices: StoreNotice[];
    events: StoreEvent[];
    is_staff: boolean;
}

export interface OpsStore extends StoreSummary {
    intro: string;
    phone: string;
    link: string;
    order: number;
}

export type StoreFields = Pick<OpsStore, 'name' | 'category' | 'intro' | 'zone' | 'location' | 'hours' | 'hours_note' | 'phone' | 'link' | 'restaurant' | 'is_active' | 'order'>;
export type StaffStoreFields = Pick<StoreFields, 'name' | 'category' | 'zone' | 'intro' | 'location' | 'hours' | 'hours_note' | 'phone' | 'link'>;
export type MenuFields = Pick<StoreMenu, 'section' | 'name' | 'price' | 'description' | 'is_signature' | 'is_sold_out' | 'order'>;
export type NoticeFields = Pick<StoreNotice, 'title' | 'body' | 'starts_at' | 'ends_at'>;
export type StoreEventFields = Pick<StoreEvent, 'kind' | 'starts_at' | 'ends_at' | 'reason'> & Partial<Pick<StoreEvent, 'open' | 'close'>>;

export interface OpsUser {
    id: number;
    nickname: string | null;
    email: string;
    group: string | number;
}

export type OpsStaff = OpsUser;

export interface OpsRestaurant {
    id: number;
    code: string | null;
    restaurant_name: string;
    display_name: string;
    is_active: boolean;
}
