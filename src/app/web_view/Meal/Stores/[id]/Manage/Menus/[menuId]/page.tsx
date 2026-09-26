'use client';

import { useParams } from 'next/navigation';
import { useSafeBack } from '@/app/web_view/hooks/useSafeBack';
import { ErrorState, ManageScreen } from '../../../../_components/ManageScreen';
import { MenuForm } from '../../../../_components/MenuForm';

// /Manage/Menus/new shares this route: the "new" id opens an empty form.
export default function MenuEditPage() {
    const { id, menuId } = useParams<{ id: string; menuId: string }>();
    const isNew = menuId === 'new';
    const back = useSafeBack();
    return (
        <ManageScreen id={Number(id)} title={isNew ? '메뉴 추가' : '메뉴 수정'}>
            {(store) => {
                const menu = isNew ? null : store.menus.find((m) => m.id === Number(menuId));
                if (!isNew && !menu) return <ErrorState message="메뉴를 찾을 수 없어요" />;
                return <MenuForm key={menu?.id ?? 'new'} storeId={store.id} menu={menu ?? null} onDone={back} />;
            }}
        </ManageScreen>
    );
}
