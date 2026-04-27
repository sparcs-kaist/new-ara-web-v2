'use client';

import type { ReactNode } from 'react';

/**
 * The bordered box used for the notice / trade / student-community sections
 * on the home page. Mirrors the Flutter `Container` with `padding 15`,
 * `border 1px #F0F0F0`, `borderRadius 20`.
 */
export function SectionBox({ children }: { children: ReactNode }) {
    return (
        <div className="mx-5 rounded-[20px] border border-[#F0F0F0] p-[15px]">
            {children}
        </div>
    );
}

/** 1px hairline divider inside a SectionBox or rank list. */
export function HairlineDivider({ inset = 0 }: { inset?: number }) {
    return (
        <div className="flex">
            {inset > 0 && <div style={{ width: inset }} />}
            <div className="h-px flex-1 bg-[#F0F0F0]" />
        </div>
    );
}
