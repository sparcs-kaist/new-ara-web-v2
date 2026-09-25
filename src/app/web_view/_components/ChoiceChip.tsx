'use client';

import type { ReactNode } from 'react';

export function ChoiceChip({
    selected,
    onClick,
    size = 'md',
    role,
    className = '',
    children,
}: {
    selected: boolean;
    onClick: () => void;
    size?: 'md' | 'sm';
    role?: 'tab';
    className?: string;
    children: ReactNode;
}) {
    return (
        <button
            type="button"
            data-chip
            role={role}
            aria-selected={role === 'tab' ? selected : undefined}
            aria-pressed={role === 'tab' ? undefined : selected}
            onClick={onClick}
            className={`shrink-0 whitespace-nowrap rounded-full border font-semibold ${size === 'sm' ? 'h-8 px-3 text-[13px]' : 'h-9 px-4 text-[15px]'} ${selected ? 'border-[#222222] bg-[#222222] text-white' : 'border-[#444444] bg-white text-[#222222]'} ${className}`}
        >
            {children}
        </button>
    );
}

export function ChoiceChipRow({ role, className = '', children }: { role?: 'tablist'; className?: string; children: ReactNode }) {
    return (
        <div role={role} className={`no-scrollbar flex gap-2 overflow-x-auto px-5 py-3 ${className}`}>
            {children}
        </div>
    );
}
