export type Zone = 'EAST' | 'WEST' | 'NORTH';

export const ZONE_LABELS: Record<Zone, string> = { EAST: '동측', WEST: '서측', NORTH: '북측' };

export interface StoreSummary {
    id: number;
    name: string;
    zone: Zone;
    location: string;
    hours: string;
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

export interface StoreDetail extends StoreSummary {
    intro: string;
    phone: string;
    link: string;
    menus: StoreMenu[];
    notices: StoreNotice[];
    is_staff: boolean;
}

export interface OpsStore extends StoreSummary {
    intro: string;
    phone: string;
    link: string;
    order: number;
}

export type StoreFields = Pick<OpsStore, 'name' | 'intro' | 'zone' | 'location' | 'hours' | 'phone' | 'link' | 'restaurant' | 'is_active' | 'order'>;
export type StaffStoreFields = Pick<StoreFields, 'intro' | 'location' | 'hours' | 'phone' | 'link'>;
export type MenuFields = Pick<StoreMenu, 'section' | 'name' | 'price' | 'description' | 'is_sold_out' | 'order'>;
export type NoticeFields = Pick<StoreNotice, 'title' | 'body' | 'starts_at' | 'ends_at'>;

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
