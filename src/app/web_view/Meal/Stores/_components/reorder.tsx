'use client';

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { MenuIcon } from '@/app/web_view/_components';

interface Drag {
    id: number;
    from: number;
    dy: number;
    height: number;
}

const HOLD_MS = 200;

const targetIndex = (d: Drag, count: number) => Math.max(0, Math.min(count - 1, d.from + Math.round(d.dy / d.height)));

// Rows are <li>s of equal height; holding a row's handle lifts it and onMove gets the indexes once it lands elsewhere.
export function useHoldToReorder(count: number, onMove: (from: number, to: number) => void) {
    const [drag, setDrag] = useState<Drag | null>(null);
    const countRef = useRef(count);
    countRef.current = count;
    const onMoveRef = useRef(onMove);
    onMoveRef.current = onMove;
    const dragAbort = useRef<AbortController | null>(null);

    useEffect(() => () => dragAbort.current?.abort(), []);

    const onHandleDown = (id: number, index: number) => (e: ReactPointerEvent<HTMLButtonElement>) => {
        if (drag || e.button !== 0) return;
        e.preventDefault();
        dragAbort.current?.abort();
        const ac = new AbortController();
        dragAbort.current = ac;
        const { signal } = ac;
        const startY = e.clientY;
        let state: Drag = { id, from: index, dy: 0, height: e.currentTarget.closest('li')?.getBoundingClientRect().height ?? 1 };
        let lifted = false;
        const hold = window.setTimeout(() => {
            lifted = true;
            setDrag(state);
        }, HOLD_MS);
        signal.addEventListener('abort', () => window.clearTimeout(hold));
        const onPointerMove = (ev: PointerEvent) => {
            if (!lifted) return;
            state = { ...state, dy: ev.clientY - startY };
            setDrag(state);
        };
        const onUp = () => {
            ac.abort();
            if (!lifted) return;
            setDrag(null);
            const to = targetIndex(state, countRef.current);
            if (to !== state.from) onMoveRef.current(state.from, to);
        };
        window.addEventListener('pointermove', onPointerMove, { signal });
        window.addEventListener('pointerup', onUp, { signal });
        window.addEventListener('pointercancel', onUp, { signal });
    };

    const to = drag ? targetIndex(drag, count) : -1;

    const rowProps = (id: number, index: number) => {
        let transform: string | undefined;
        if (drag && drag.id === id) transform = `translateY(${drag.dy}px)`;
        else if (drag && drag.from < index && index <= to) transform = `translateY(-${drag.height}px)`;
        else if (drag && to <= index && index < drag.from) transform = `translateY(${drag.height}px)`;
        return {
            style: { transform },
            className: drag?.id === id ? 'relative z-10 bg-white shadow-[0_4px_16px_rgba(0,0,0,0.12)]' : 'transition-transform duration-150',
        };
    };

    return { dragging: !!drag, onHandleDown, rowProps };
}

export function ReorderHandle({ label, onPointerDown }: { label: string; onPointerDown: (e: ReactPointerEvent<HTMLButtonElement>) => void }) {
    return (
        <button
            type="button"
            data-press="none"
            aria-label={label}
            onPointerDown={onPointerDown}
            className="-ml-2 flex h-10 w-8 shrink-0 cursor-grab touch-none items-center justify-center text-[#BBBBBB]"
        >
            <MenuIcon size={22} />
        </button>
    );
}
