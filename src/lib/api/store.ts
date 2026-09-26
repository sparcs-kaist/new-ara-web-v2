import http from '@/lib/api/http';
import { queryBuilder } from '@/lib/utils/queryBuilder';
import type {
    MenuFields,
    NoticeFields,
    OpsRestaurant,
    OpsStaff,
    OpsStore,
    OpsUser,
    StaffStoreFields,
    StoreDetail,
    StoreEvent,
    StoreEventFields,
    StoreFields,
    StoreMenu,
    StoreNotice,
    StoreSummary,
    Zone,
} from '@/lib/types/store';

export { apiDetail } from '@/lib/api/delivery';

const coverForm = (file: File) => {
    const fd = new FormData();
    fd.append('cover', file);
    return fd;
};

export const fetchStores = async (zone?: Zone) => {
    const qs = queryBuilder({ zone });
    const { data } = await http.get<StoreSummary[]>(`stores/${qs ? `?${qs}` : ''}`);
    return data;
};

export const fetchStore = async (id: number) => {
    const { data } = await http.get<StoreDetail>(`stores/${id}/`);
    return data;
};

export const updateStore = async (id: number, body: Partial<StaffStoreFields>) => {
    const { data } = await http.patch<StoreDetail>(`stores/${id}/`, body);
    return data;
};

// Multipart cannot carry the hours object, so the cover travels alone.
export const updateStoreCover = async (id: number, file: File) => {
    const { data } = await http.patch<StoreDetail>(`stores/${id}/`, coverForm(file));
    return data;
};

export const menuFormData = (fields: Partial<MenuFields>, photo?: File | null) => {
    const fd = new FormData();
    Object.entries(fields).forEach(([k, v]) => fd.append(k, String(v)));
    if (photo) fd.append('photo', photo);
    return fd;
};

export const createMenu = async (id: number, body: FormData) => {
    const { data } = await http.post<StoreMenu>(`stores/${id}/menus/`, body);
    return data;
};

export const updateMenu = async (id: number, menuId: number, body: FormData | Partial<MenuFields>) => {
    const { data } = await http.patch<StoreMenu>(`stores/${id}/menus/${menuId}/`, body);
    return data;
};

export const deleteMenu = async (id: number, menuId: number): Promise<void> => {
    await http.delete(`stores/${id}/menus/${menuId}/`);
};

export const createNotice = async (id: number, body: NoticeFields) => {
    const { data } = await http.post<StoreNotice>(`stores/${id}/notices/`, body);
    return data;
};

export const updateNotice = async (id: number, noticeId: number, body: Partial<NoticeFields>) => {
    const { data } = await http.patch<StoreNotice>(`stores/${id}/notices/${noticeId}/`, body);
    return data;
};

export const deleteNotice = async (id: number, noticeId: number): Promise<void> => {
    await http.delete(`stores/${id}/notices/${noticeId}/`);
};

export const fetchStoreEvents = async (id: number) => {
    const { data } = await http.get<StoreEvent[]>(`stores/${id}/events/`);
    return data;
};

export const createStoreEvent = async (id: number, body: StoreEventFields) => {
    const { data } = await http.post<StoreEvent>(`stores/${id}/events/`, body);
    return data;
};

export const updateStoreEvent = async (id: number, eventId: number, body: Partial<StoreEventFields>) => {
    const { data } = await http.patch<StoreEvent>(`stores/${id}/events/${eventId}/`, body);
    return data;
};

export const deleteStoreEvent = async (id: number, eventId: number): Promise<void> => {
    await http.delete(`stores/${id}/events/${eventId}/`);
};

export const fetchMyStores = async () => {
    const { data } = await http.get<{ store_ids: number[] }>('stores/mine/');
    return data;
};

export const opsFetchStores = async () => {
    const { data } = await http.get<OpsStore[]>('ops/stores/');
    return data;
};

export const opsCreateStore = async (body: FormData) => {
    const { data } = await http.post<OpsStore>('ops/stores/', body);
    return data;
};

export const opsUpdateStore = async (id: number, body: Partial<StoreFields>) => {
    const { data } = await http.patch<OpsStore>(`ops/stores/${id}/`, body);
    return data;
};

export const opsUpdateStoreCover = async (id: number, file: File) => {
    const { data } = await http.patch<OpsStore>(`ops/stores/${id}/`, coverForm(file));
    return data;
};

export const opsDeleteStore = async (id: number): Promise<void> => {
    await http.delete(`ops/stores/${id}/`);
};

export const opsFetchStaff = async (id: number) => {
    const { data } = await http.get<OpsStaff[]>(`ops/stores/${id}/staff/`);
    return data;
};

export const opsAddStaff = async (id: number, userId: number, grantGroup?: boolean) => {
    const { data } = await http.post<OpsStaff>(`ops/stores/${id}/staff/`, {
        user_id: userId,
        ...(grantGroup ? { grant_group: true } : {}),
    });
    return data;
};

export const opsRemoveStaff = async (id: number, userId: number): Promise<void> => {
    await http.delete(`ops/stores/${id}/staff/${userId}/`);
};

export const opsSearchUsers = async (q: string) => {
    const { data } = await http.get<OpsUser[]>(`ops/users/?${queryBuilder({ q })}`);
    return data;
};

export const opsFetchRestaurants = async () => {
    const { data } = await http.get<OpsRestaurant[]>('ops/restaurants/');
    return data;
};

export const opsUpdateRestaurant = async (id: number, body: { display_name?: string; code?: string | null; is_active?: boolean }) => {
    const { data } = await http.patch<OpsRestaurant>(`ops/restaurants/${id}/`, body);
    return data;
};

export const isGroupRequired = (e: unknown) =>
    (e as { response?: { data?: { code?: unknown } } } | null)?.response?.data?.code === 'group_required';

export const errorStatus = (e: unknown) => (e as { response?: { status?: number } } | null)?.response?.status;
