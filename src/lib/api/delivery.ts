import http from '@/lib/api/http';
import { queryBuilder } from '@/lib/utils/queryBuilder';
import type {
    DeliveryOrder,
    DeliveryOrderBody,
    DeliveryParty,
    DeliveryPartyCreateBody,
    DeliveryPartySummary,
    DeliveryPartyUpdateBody,
    DeliveryPaymentRequestBody,
    DeliveryPenalty,
    Paginated,
} from '@/lib/types/delivery';

export interface DeliveryListParams {
    page?: number;
    page_size?: number;
    search?: string;
    joined?: boolean;
}

export const fetchDeliveryParties = async ({ page, page_size, search, joined }: DeliveryListParams = {}) => {
    const qs = queryBuilder({
        page,
        page_size,
        search: search || undefined,
        // The API only honours the literal string 'true'.
        joined: joined ? 'true' : undefined,
    });
    const { data } = await http.get<Paginated<DeliveryPartySummary>>(`/delivery/${qs ? `?${qs}` : ''}`);
    return data;
};

export const fetchDeliveryParty = async (id: number) => {
    const { data } = await http.get<DeliveryParty>(`/delivery/${id}/`);
    return data;
};

export const createDeliveryParty = async (body: DeliveryPartyCreateBody) => {
    const { data } = await http.post<DeliveryParty>('/delivery/', body);
    return data;
};

export const updateDeliveryParty = async (id: number, body: DeliveryPartyUpdateBody) => {
    const { data } = await http.patch<DeliveryParty>(`/delivery/${id}/`, body);
    return data;
};

export const fetchDeliveryPenalty = async () => {
    const { data } = await http.get<DeliveryPenalty>('/delivery/penalty/');
    return data;
};

export const joinDeliveryParty = async (id: number) => {
    const { data } = await http.post<DeliveryParty>(`/delivery/${id}/join/`);
    return data;
};

export const leaveDeliveryParty = async (id: number): Promise<void> => {
    await http.post(`/delivery/${id}/leave/`);
};

export const createDeliveryOrder = async (id: number, body: DeliveryOrderBody) => {
    const { data } = await http.post<DeliveryOrder>(`/delivery/${id}/orders/`, body);
    return data;
};

export const updateDeliveryOrder = async (id: number, orderId: number, body: Partial<DeliveryOrderBody>) => {
    const { data } = await http.patch<DeliveryOrder>(`/delivery/${id}/orders/${orderId}/`, body);
    return data;
};

export const cancelDeliveryOrder = async (id: number, orderId: number): Promise<void> => {
    await http.delete(`/delivery/${id}/orders/${orderId}/`);
};

export const kickDeliveryMember = async (id: number, anon_number: number) => {
    const { data } = await http.post<DeliveryParty>(`/delivery/${id}/kick/`, { anon_number });
    return data;
};

export const confirmDeliveryParty = async (id: number) => {
    const { data } = await http.post<DeliveryParty>(`/delivery/${id}/confirm/`);
    return data;
};

export const extendDeliveryParty = async (id: number, minutes: number) => {
    const { data } = await http.post<DeliveryParty>(`/delivery/${id}/extend/`, { minutes });
    return data;
};

export const cancelDeliveryParty = async (id: number) => {
    const { data } = await http.post<DeliveryParty>(`/delivery/${id}/cancel/`);
    return data;
};

export const arriveDeliveryParty = async (id: number) => {
    const { data } = await http.post<DeliveryParty>(`/delivery/${id}/arrive/`);
    return data;
};

export const requestDeliveryPayment = async (id: number, body: DeliveryPaymentRequestBody) => {
    const { data } = await http.post(`/delivery/${id}/payment-request/`, body);
    return data;
};

/** User-facing text for a failed delivery call: `detail`, else the first field error. */
export function apiDetail(e: unknown): string {
    const data = (e as { response?: { data?: unknown } } | null)?.response?.data;
    if (Array.isArray(data) && typeof data[0] === 'string') return data[0];
    if (data && typeof data === 'object' && !Array.isArray(data)) {
        const { detail } = data as { detail?: unknown };
        if (typeof detail === 'string') return detail;
        const first = Object.values(data)[0];
        if (Array.isArray(first) && typeof first[0] === 'string') return first[0];
    }
    return '잠시 후 다시 시도해 주세요.';
}
