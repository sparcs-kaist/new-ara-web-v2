export const OPS_STORES_KEY = ['ops', 'stores'] as const;
export const OPS_RESTAURANTS_KEY = ['ops', 'restaurants'] as const;
export const opsStaffKey = (storeId: number) => ['ops', 'staff', storeId] as const;
export const opsStoreKey = (storeId: number) => ['ops', 'store', storeId] as const;
export const opsStoreEventsKey = (storeId: number) => ['ops', 'events', storeId] as const;
