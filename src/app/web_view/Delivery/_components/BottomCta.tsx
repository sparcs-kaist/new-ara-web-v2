'use client';

import type { ButtonHTMLAttributes, ReactNode } from 'react';

export function CtaButton(props: ButtonHTMLAttributes<HTMLButtonElement>) {
    return (
        <button
            type="button"
            data-press="strong"
            {...props}
            className="h-[52px] w-full rounded-[14px] bg-ara_red text-[16px] font-semibold text-white disabled:bg-[#F0F0F0] disabled:text-[#BBBBBB]"
        />
    );
}

/** Page content needs ~96px of bottom room so nothing hides behind it. `fade`: a list scrolls under it. */
export function FixedBottomBar({ children, fade = false }: { children: ReactNode; fade?: boolean }) {
    return (
        <div
            // Hidden while a keyboard is up ([data-ara-kb]) so it never sits on top of the focused field.
            className="fixed inset-x-0 bottom-0 z-30 border-t border-[#F0F0F0] bg-white px-5 pt-3 [[data-ara-kb]_&]:hidden"
            style={{ paddingBottom: 'calc(20px + var(--ara-safe-bottom))' }}
        >
            {fade && <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-full h-10 bg-gradient-to-b from-white/0 to-white" />}
            {children}
        </div>
    );
}
