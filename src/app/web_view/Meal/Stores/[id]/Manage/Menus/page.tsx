'use client';

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { MenuIcon, RightChevronIcon } from '@/app/web_view/_components';
import { storeKey, useInvalidateStores } from '@/app/web_view/_query';
import { usePullToRefresh } from '@/app/web_view/hooks/usePullToRefresh';
import { apiDetail, updateMenu } from '@/lib/api/store';
import { formatWon } from '@/lib/delivery';
import type { StoreDetail, StoreMenu } from '@/lib/types/store';
import { EmptyState } from '../../../_components/EmptyState';
import { ManageScreen, manageUrl } from '../../../_components/ManageScreen';
import { SignatureBadge } from '../../../_components/SignatureBadge';
import { StoreCover } from '../../../_components/StoreCover';
import { DashedButton } from '../../../_components/formParts';

interface Drag {
    id: number;
    from: number;
    dy: number;
    height: number;
}

const HOLD_MS = 200;

const targetIndex = (d: Drag, count: number) => Math.max(0, Math.min(count - 1, d.from + Math.round(d.dy / d.height)));

function MenuList({ store }: { store: StoreDetail }) {
    const router = useRouter();
    const qc = useQueryClient();
    const invalidate = useInvalidateStores();
    const [error, setError] = useState<string | null>(null);
    const [drag, setDrag] = useState<Drag | null>(null);
    const menus = store.menus;
    const menusRef = useRef(menus);
    menusRef.current = menus;
    const dragAbort = useRef<AbortController | null>(null);
    const base = `${manageUrl(store.id)}/Menus`;

    usePullToRefresh();

    useEffect(() => () => dragAbort.current?.abort(), []);

    const setMenus = (next: StoreMenu[]) => qc.setQueryData<StoreDetail>(storeKey(store.id), (old) => (old ? { ...old, menus: next } : old));

    const toggleSoldOut = async (m: StoreMenu) => {
        setMenus(menusRef.current.map((x) => (x.id === m.id ? { ...x, is_sold_out: !m.is_sold_out } : x)));
        setError(null);
        try {
            await updateMenu(store.id, m.id, { is_sold_out: !m.is_sold_out });
        } catch (e) {
            setError(apiDetail(e));
        }
        invalidate();
    };

    const commit = async (from: number, to: number) => {
        const next = [...menusRef.current];
        const [moved] = next.splice(from, 1);
        next.splice(to, 0, moved);
        setMenus(next.map((m, i) => ({ ...m, order: i })));
        setError(null);
        try {
            await Promise.all(next.map((m, i) => (m.order === i ? null : updateMenu(store.id, m.id, { order: i }))));
        } catch (e) {
            setError(apiDetail(e));
        }
        invalidate();
    };

    const onHandleDown = (m: StoreMenu, index: number) => (e: ReactPointerEvent<HTMLButtonElement>) => {
        if (drag || e.button !== 0) return;
        e.preventDefault();
        dragAbort.current?.abort();
        const ac = new AbortController();
        dragAbort.current = ac;
        const { signal } = ac;
        const startY = e.clientY;
        let state: Drag = { id: m.id, from: index, dy: 0, height: e.currentTarget.closest('li')?.getBoundingClientRect().height ?? 1 };
        let lifted = false;
        const hold = window.setTimeout(() => {
            lifted = true;
            setDrag(state);
        }, HOLD_MS);
        signal.addEventListener('abort', () => window.clearTimeout(hold));
        const onMove = (ev: PointerEvent) => {
            if (!lifted) return;
            state = { ...state, dy: ev.clientY - startY };
            setDrag(state);
        };
        const onUp = () => {
            ac.abort();
            if (!lifted) return;
            setDrag(null);
            const to = targetIndex(state, menusRef.current.length);
            if (to !== state.from) commit(state.from, to);
        };
        window.addEventListener('pointermove', onMove, { signal });
        window.addEventListener('pointerup', onUp, { signal });
        window.addEventListener('pointercancel', onUp, { signal });
    };

    const to = drag ? targetIndex(drag, menus.length) : -1;

    return (
        <div className="pb-8">
            {menus.length === 0 ? (
                <EmptyState title="메뉴를 추가해 보세요" className="py-10" />
            ) : (
                <ul className={drag ? 'select-none' : ''}>
                    {menus.map((m, i) => {
                        const lifted = drag?.id === m.id;
                        let transform: string | undefined;
                        if (drag && lifted) transform = `translateY(${drag.dy}px)`;
                        else if (drag && drag.from < i && i <= to) transform = `translateY(-${drag.height}px)`;
                        else if (drag && to <= i && i < drag.from) transform = `translateY(${drag.height}px)`;
                        const out = m.is_sold_out;
                        return (
                            <li
                                key={m.id}
                                style={{ transform }}
                                className={lifted ? 'relative z-10 bg-white shadow-[0_4px_16px_rgba(0,0,0,0.12)]' : 'transition-transform duration-150'}
                            >
                                <div className="mx-5 flex h-[72px] items-center gap-3 border-b border-[#F0F0F0]">
                                    <button
                                        type="button"
                                        data-press="none"
                                        aria-label={`${m.name} 순서 이동`}
                                        onPointerDown={onHandleDown(m, i)}
                                        className="-ml-2 flex h-10 w-8 shrink-0 cursor-grab touch-none items-center justify-center text-[#BBBBBB]"
                                    >
                                        <MenuIcon size={22} />
                                    </button>
                                    <StoreCover src={m.photo} alt={m.name} sizes="56px" iconSize={20} className="h-14 w-14 shrink-0 rounded-[8px]" />
                                    <button type="button" onClick={() => router.push(`${base}/${m.id}`)} className="min-w-0 flex-1 text-left">
                                        <span className="flex items-center gap-[6px]">
                                            <span className={`truncate text-[15px] font-medium ${out ? 'text-[#B0B0B0]' : 'text-[#222222]'}`}>{m.name}</span>
                                            {m.is_signature && <SignatureBadge />}
                                        </span>
                                        <span className={`mt-[2px] block text-[13px] ${out ? 'text-[#B0B0B0]' : 'text-[#646464]'}`}>{formatWon(m.price)}</span>
                                    </button>
                                    <button
                                        type="button"
                                        aria-pressed={out}
                                        onClick={() => toggleSoldOut(m)}
                                        className={`h-7 shrink-0 rounded-full px-3 text-[12px] font-medium ${out ? 'bg-[#FFF1F1] text-ara_red' : 'border border-[#DDDDDD] text-[#8A8A8A]'}`}
                                    >
                                        품절
                                    </button>
                                    <button type="button" aria-label={`${m.name} 수정`} onClick={() => router.push(`${base}/${m.id}`)} className="-mr-2 flex h-10 w-8 shrink-0 items-center justify-center text-[#BBBBBB]">
                                        <RightChevronIcon size={18} />
                                    </button>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            )}
            <div className="px-5 pt-5">
                <DashedButton onClick={() => router.push(`${base}/new`)}>+ 메뉴 추가</DashedButton>
                {menus.length > 1 && <p className="mt-2 text-center text-[12px] text-[#8A8A8A]">길게 눌러 순서를 바꿀 수 있어요</p>}
                {error && <p className="mt-2 text-center text-[13px] text-ara_red">{error}</p>}
            </div>
        </div>
    );
}

export default function MenusPage() {
    const id = Number(useParams<{ id: string }>().id);
    return (
        <ManageScreen id={id} title="메뉴 관리">
            {(store) => <MenuList key={store.id} store={store} />}
        </ManageScreen>
    );
}
