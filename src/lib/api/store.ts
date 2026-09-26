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
    StoreFields,
    StoreMenu,
    StoreNotice,
    StoreSummary,
    Zone,
} from '@/lib/types/store';

export { apiDetail } from '@/lib/api/delivery';

// public
export const fetchStores = async (zone?: Zone) => {
    const qs = queryBuilder({ zone });
    const { data } = await http.get<StoreSummary[]>(`stores/${qs ? `?${qs}` : ''}`);
    return data;
};

export const fetchStore = async (id: number) => {
    const { data } = await http.get<StoreDetail>(`stores/${id}/`);
    return data;
};

// staff (StoreStaff of that store, or ops)
export const updateStore = async (id: number, body: FormData | Partial<StaffStoreFields>) => {
    const { data } = await http.patch<StoreDetail>(`stores/${id}/`, body);
    return data;
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

export const fetchMyStores = async () => {
    const { data } = await http.get<{ store_ids: number[] }>('stores/mine/');
    return data;
};

// ops (is_staff only; 403 otherwise)
export const opsFetchStores = async () => {
    const { data } = await http.get<OpsStore[]>('ops/stores/');
    return data;
};

export const opsCreateStore = async (body: FormData) => {
    const { data } = await http.post<OpsStore>('ops/stores/', body);
    return data;
};

export const opsUpdateStore = async (id: number, body: FormData | Partial<StoreFields>) => {
    const { data } = await http.patch<OpsStore>(`ops/stores/${id}/`, body);
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

export const opsUpdateRestaurant = async (id: number, body: { display_name?: string; code?: string; is_active?: boolean }) => {
    const { data } = await http.patch<OpsRestaurant>(`ops/restaurants/${id}/`, body);
    return data;
};

export const isGroupRequired = (e: unknown) =>
    (e as { response?: { data?: { code?: unknown } } } | null)?.response?.data?.code === 'group_required';

export const errorStatus = (e: unknown) => (e as { response?: { status?: number } } | null)?.response?.status;
