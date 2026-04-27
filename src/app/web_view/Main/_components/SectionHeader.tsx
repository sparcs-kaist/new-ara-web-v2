'use client';

import type { ReactNode } from 'react';

interface SectionHeaderProps {
    title: string;
    trailing?: ReactNode;
}

export function SectionHeader({ title, trailing }: SectionHeaderProps) {
    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px var(--ara-spacing-lg) 8px',
            }}
        >
            <h2
                style={{
                    margin: 0,
                    fontSize: 18,
                    fontWeight: 700,
                    color: 'var(--ara-text-primary)',
                }}
            >
                {title}
            </h2>
            {trailing}
        </div>
    );
}
