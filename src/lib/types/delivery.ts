// 함께 배달 API 타입 (apps/delivery serializers)

export type DeliveryStatus =
    | 'RECRUITING'
    | 'WAITING_DECISION'
    | 'ORDERED'
    | 'ARRIVED'
    | 'SETTLED'
    | 'CANCELED';

export interface DeliveryMember {
    display_name: string;
    anon_number: number;
    role: 'OWNER' | 'PARTICIPANT' | 'BLOCKED';
    is_mine: boolean;
}

export interface DeliveryOrder {
    id: number;
    message_id: number;
    party: number;
    orderer: DeliveryMember;
    menu_name: string;
    price: number;
    is_canceled: boolean;
    created_at: string;
}

export interface DeliveryPartySummary {
    id: number;
    chat_room: number;
    store_name: string;
    place_name: string;
    place_detail: string;
    min_order_amount: number;
    total_amount: number;
    participant_count: number;
    max_participants: number | null;
    deadline_at: string;
    status: DeliveryStatus;
    created_at: string;
}

export interface DeliveryParty extends DeliveryPartySummary {
    memo: string;
    order_link: string;
    recruit_minutes: number;
    decision_deadline_at: string | null;
    cancel_reason: '' | 'HOST' | 'NO_DECISION';
    ordered_at: string | null;
    arrived_at: string | null;
    settled_at: string | null;
    host_orders: { menu_name: string; price: number }[];
    members: DeliveryMember[];
    orders: DeliveryOrder[] | null;
    is_member: boolean;
    is_host: boolean;
    payment_request: number | null;
}

export interface Paginated<T> {
    num_pages: number;
    num_items: number;
    current: number;
    previous: string | null;
    next: string | null;
    results: T[];
}

export interface DeliveryPartyCreateBody {
    store_name: string;
    place_name: string;
    place_detail?: string;
    min_order_amount: number;
    recruit_minutes: number;
    max_participants?: number | null;
    memo?: string;
    order_link?: string;
    price: number;
    menu_name?: string;
}

export type DeliveryPartyUpdateBody = Partial<
    Pick<DeliveryParty, 'memo' | 'order_link' | 'place_detail' | 'max_participants'>
>;

export interface DeliveryOrderBody {
    price: number;
    menu_name?: string;
}

export interface DeliveryPaymentRequestBody {
    bank_name: string;
    account_number: string;
    delivery_fee?: number;
}
