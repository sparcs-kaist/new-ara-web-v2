'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { AppHeader, Screen, Skeleton } from '@/app/web_view/_components';
import { useStore } from '@/app/web_view/_query';
import { useSafeBack } from '@/app/web_view/hooks/useSafeBack';
import { apiDetail, errorStatus } from '@/lib/api/store';
import type { StoreDetail } from '@/lib/types/store';

export const storeUrl = (id: number) => `/web_view/Meal/Stores/${id}`;
export const manageUrl = (id: number) => `${storeUrl(id)}/Manage`;

// Non-staff are sent to the public store page; the store is only handed out to staff.
export function useStaffStore(id: number) {
    const router = useRouter();
    const { data, isError, error } = useStore(id);
    const forbidden = (!!data && !data.is_staff) || errorStatus(error) === 403;
    useEffect(() => {
        if (forbidden) router.replace(storeUrl(id));
    }, [forbidden, id, router]);
    return { store: forbidden ? undefined : data, isError: isError && !forbidden, error };
}

export function ErrorState({ message }: { message: string }) {
    const back = useSafeBack();
    return (
        <div className="flex flex-1 flex-col items-center justify-center pb-20 text-center">
            <p className="text-[16px] font-bold text-[#222222]">{message}</p>
            <button type="button" onClick={back} className="mt-5 h-[44px] rounded-[10px] bg-[#F6F6F6] px-6 text-[15px] font-medium text-[#646464]">
                돌아가기
            </button>
        </div>
    );
}

export function ManageScreen({ id, title, children }: { id: number; title: string; children: (store: StoreDetail) => ReactNode }) {
    const back = useSafeBack();
    const { store, isError, error } = useStaffStore(id);
    const notFound = !(id > 0) || errorStatus(error) === 404;
    return (
        <Screen withTabBar={false}>
            <AppHeader title={title} onBack={back} />
            {store ? (
                children(store)
            ) : isError || notFound ? (
                <ErrorState message={notFound ? '업체를 찾을 수 없어요' : apiDetail(error)} />
            ) : (
                <div className="px-5 pt-3">
                    <Skeleton className="h-[200px] w-full rounded-[12px]" />
                    <Skeleton className="mt-5 h-12 w-full rounded-[10px]" />
                    <Skeleton className="mt-3 h-12 w-full rounded-[10px]" />
                </div>
            )}
        </Screen>
    );
}
