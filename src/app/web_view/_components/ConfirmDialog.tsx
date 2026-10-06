'use client';

import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface DialogAction {
    label: string;
    onClick: () => void;
    disabled?: boolean;
}

interface ConfirmDialogProps {
    title: string;
    children?: ReactNode;
    secondary?: DialogAction;
    primary: DialogAction;
    /** Escape, which the layout also dispatches on hardware back. */
    onClose: () => void;
}

export function ConfirmDialog({ title, children, secondary, primary, onClose }: ConfirmDialogProps) {
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [onClose]);

    // Portaled above BottomSheet (z-71): a dialog can open while a sheet is still sliding out.
    return createPortal(
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 px-8">
            <div role="dialog" aria-modal="true" aria-label={title} className="w-full max-w-[320px] rounded-[20px] bg-white p-6">
                <h2 className="break-keep text-[18px] font-semibold text-black">{title}</h2>
                {children}
                <div className="mt-6 flex gap-2">
                    {secondary && (
                        <button
                            type="button"
                            disabled={secondary.disabled}
                            onClick={secondary.onClick}
                            className="h-[44px] flex-1 rounded-[10px] bg-[#F6F6F6] text-[15px] font-medium text-[#646464]"
                        >
                            {secondary.label}
                        </button>
                    )}
                    <button
                        type="button"
                        data-press="strong"
                        disabled={primary.disabled}
                        onClick={primary.onClick}
                        className="h-[44px] flex-1 rounded-[10px] bg-ara_red text-[15px] font-medium text-white"
                    >
                        {primary.label}
                    </button>
                </div>
            </div>
        </div>,
        document.body,
    );
}
