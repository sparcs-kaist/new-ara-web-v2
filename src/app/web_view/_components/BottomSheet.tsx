'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

const KB_LIFT = 'max(var(--kb-inset, 0px), var(--ara-kb-pending, 0px))';

interface BottomSheetProps {
    open: boolean;
    onClose: () => void;
    title?: string;
    children: ReactNode;
}

export function BottomSheet({ open, onClose, title, children }: BottomSheetProps) {
    const [mounted, setMounted] = useState(false);
    const [shown, setShown] = useState(false);
    const [dragY, setDragY] = useState(0);
    const [dragging, setDragging] = useState(false);
    const panelRef = useRef<HTMLDivElement>(null);
    const dragRef = useRef({ startY: 0, height: 0, dy: 0, lastY: 0, lastT: 0, vy: 0, active: false });

    useEffect(() => {
        if (open) {
            setMounted(true);
            return;
        }
        setShown(false);
        // Fallback for when transitionend never fires (e.g. the sheet was never shown).
        const t = window.setTimeout(() => setMounted(false), 400);
        return () => window.clearTimeout(t);
    }, [open]);

    // Show on the frame after mounting so the panel slides up instead of appearing.
    useEffect(() => {
        if (!mounted || !open) return;
        let inner = 0;
        const outer = requestAnimationFrame(() => {
            inner = requestAnimationFrame(() => setShown(true));
        });
        return () => {
            cancelAnimationFrame(outer);
            cancelAnimationFrame(inner);
        };
    }, [mounted, open]);

    // The layout dispatches Escape on hardware back while a dialog is open.
    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [open, onClose]);

    // 아래로 끌어 닫기 (채팅 첨부 시트와 같은 규칙): 시트 내용이 맨 위일 때만 시작하고, 높이의 1/3을 넘기거나 빠르게 놓으면 닫는다.
    const onTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
        const y = e.touches[0].clientY;
        const active = (panelRef.current?.scrollTop ?? 0) <= 0;
        dragRef.current = { startY: y, height: panelRef.current?.getBoundingClientRect().height ?? 0, dy: 0, lastY: y, lastT: e.timeStamp, vy: 0, active };
        if (active) setDragging(true);
    };
    const onTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
        const d = dragRef.current;
        if (!d.active) return;
        const y = e.touches[0].clientY;
        const dt = e.timeStamp - d.lastT;
        if (dt > 0) d.vy = (y - d.lastY) / dt;
        d.lastY = y;
        d.lastT = e.timeStamp;
        d.dy = Math.max(0, y - d.startY);
        setDragY(d.dy);
    };
    const onTouchEnd = () => {
        const { dy, height, vy, active } = dragRef.current;
        setDragging(false);
        setDragY(0);
        dragRef.current.active = false;
        if (active && dy > 8 && (dy > height / 3 || vy > 0.5)) onClose();
    };
    const scrimOpacity = dragging && dragRef.current.height > 0 ? Math.max(0, 1 - dragY / dragRef.current.height) : 1;

    if (!mounted) return null;

    return createPortal(
        <>
            <div
                className={`fixed inset-0 z-[70] bg-black/40 ${dragging ? '' : 'transition-opacity duration-200'} ${shown ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
                style={dragging ? { opacity: scrimOpacity } : undefined}
                onClick={onClose}
            />
            <div
                ref={panelRef}
                role="dialog"
                aria-modal="true"
                aria-label={title}
                className={`fixed inset-x-0 z-[71] overflow-y-auto rounded-t-[20px] bg-white ${dragging ? '' : 'transition-transform duration-[250ms] ease-out'} ${shown ? 'translate-y-0' : 'pointer-events-none translate-y-full'}`}
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
                onTouchCancel={onTouchEnd}
                style={{
                    ...(dragY > 0 ? { transform: `translateY(${dragY}px)` } : {}),
                    // Rides the keyboard like the chat composer: the overlay inset on iOS, the predicted lift on Android.
                    bottom: KB_LIFT,
                    maxHeight: `calc(85dvh - ${KB_LIFT})`,
                    paddingBottom: `calc(20px + max(0px, var(--ara-safe-bottom) - var(--ara-kb-shrink, 0px) - ${KB_LIFT}))`,
                }}
                onTransitionEnd={(e) => {
                    if (e.target === e.currentTarget && e.propertyName === 'transform' && !open) setMounted(false);
                }}
            >
                <div className="mx-auto mt-[10px] h-[4px] w-[36px] rounded-full bg-[#D9D9D9]" />
                {title && <h2 className="pb-4 pt-3 text-center text-[18px] font-semibold text-black">{title}</h2>}
                {children}
            </div>
        </>,
        document.body,
    );
}
