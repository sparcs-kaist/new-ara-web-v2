'use client';

import type { ReactNode } from 'react';

const OUTLINED = {
    md: 'h-9 border px-4 text-[15px] font-semibold',
    sm: 'h-8 border px-3 text-[13px] font-semibold',
};

const look = (variant: 'outlined' | 'filled', size: 'md' | 'sm', selected: boolean) => {
    if (variant === 'filled') return `h-[34px] px-4 text-[14px] ${selected ? 'bg-[#222222] font-bold text-white' : 'bg-[#F0F0F0] font-medium text-ara_gray'}`;
    return `${OUTLINED[size]} ${selected ? 'border-[#222222] bg-[#222222] text-white' : 'border-[#444444] bg-white text-[#222222]'}`;
};

export function ChoiceChip({
    selected,
    onClick,
    size = 'md',
    variant = 'outlined',
    role,
    className = '',
    children,
}: {
    selected: boolean;
    onClick: () => void;
    size?: 'md' | 'sm';
    variant?: 'outlined' | 'filled';
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
            className={`shrink-0 whitespace-nowrap rounded-full ${look(variant, size, selected)} ${className}`}
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
