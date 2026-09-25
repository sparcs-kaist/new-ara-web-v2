'use client';

import { useEffect, useState, type ReactNode } from 'react';
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

    if (!mounted) return null;

    return createPortal(
        <>
            <div
                className={`fixed inset-0 z-[70] bg-black/40 transition-opacity duration-200 ${shown ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
                onClick={onClose}
            />
            <div
                role="dialog"
                aria-modal="true"
                aria-label={title}
                className={`fixed inset-x-0 z-[71] overflow-y-auto rounded-t-[20px] bg-white transition-transform duration-[250ms] ease-out ${shown ? 'translate-y-0' : 'pointer-events-none translate-y-full'}`}
                style={{
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
