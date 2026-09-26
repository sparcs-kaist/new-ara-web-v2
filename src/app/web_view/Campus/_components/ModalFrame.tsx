'use client';

import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { CheckIcon } from '@/app/web_view/_components';

interface ModalFrameProps {
    title: string;
    /** Backdrop tap and Escape (hardware back via the layout) also cancel. */
    onCancel: () => void;
    onSave: () => void;
    saveDisabled?: boolean;
    /** Error line kept visible under the scrolling list. */
    message?: ReactNode;
    children: ReactNode;
}

// The 학식 allergy-filter centre modal: blurred backdrop, w-80 card, 취소 | 저장 split bar.
export function ModalFrame({ title, onCancel, onSave, saveDisabled, message, children }: ModalFrameProps) {
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onCancel();
        };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [onCancel]);

    return createPortal(
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/35 backdrop-blur-sm" onClick={onCancel}>
            <div
                role="dialog"
                aria-modal="true"
                aria-label={title}
                onClick={(e) => e.stopPropagation()}
                className="flex max-h-[80dvh] w-80 flex-col overflow-hidden rounded-xl bg-white/95 shadow-md"
            >
                <h2 className="shrink-0 pb-3 pt-7 text-center text-[18px] font-bold text-black">{title}</h2>
                <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-6 pb-2">{children}</div>
                {message && <p className="shrink-0 px-6 pb-3 pt-1 text-center text-[13px] text-ara_red">{message}</p>}
                <div className="flex shrink-0 border-t border-[#E5E5E5]">
                    <button type="button" onClick={onCancel} className="flex-1 rounded-none border-r border-[#E5E5E5] py-4 text-[16px] text-ara_red">
                        취소
                    </button>
                    <button type="button" onClick={onSave} disabled={saveDisabled} className="flex-1 rounded-none py-4 text-[16px] font-bold text-ara_red disabled:opacity-40">
                        저장
                    </button>
                </div>
            </div>
        </div>,
        document.body,
    );
}

export function ModalChoiceRow({
    checked,
    locked = false,
    role = 'checkbox',
    onToggle,
    children,
}: {
    checked: boolean;
    locked?: boolean;
    role?: 'checkbox' | 'radio';
    onToggle: () => void;
    children: ReactNode;
}) {
    return (
        <button
            type="button"
            role={role}
            aria-checked={checked}
            disabled={locked}
            onClick={onToggle}
            className="flex h-14 w-full items-center gap-5 border-b border-[#EEEEEE] px-2.5 text-left disabled:opacity-40"
        >
            {checked ? (
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ara_red text-white">
                    <CheckIcon size={14} />
                </span>
            ) : (
                <span className="h-5 w-5 shrink-0 rounded-full border border-[#CCCCCC]" />
            )}
            <span className="min-w-0 flex-1 truncate text-[16px] text-black">{children}</span>
        </button>
    );
}
