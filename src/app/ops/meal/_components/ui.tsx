'use client';

import type { ButtonHTMLAttributes, ReactNode } from 'react';

export const inputCls = 'h-9 rounded-[6px] border border-[#DDDDDD] bg-white px-3 text-[14px] text-[#222222] outline-none focus:border-[#8A8A8A] disabled:bg-[#FAFAFA]';
export const thCls = 'h-10 bg-[#FAFAFA] px-4 text-left text-[13px] font-normal text-[#8A8A8A]';
export const tdCls = 'h-[52px] border-b border-[#F0F0F0] px-4 text-[14px] text-[#222222]';

type Variant = 'primary' | 'secondary' | 'dark' | 'text';

const variantCls: Record<Variant, string> = {
    primary: 'h-9 rounded-[6px] bg-[#ED3A3A] px-4 text-[14px] font-medium text-white disabled:opacity-40',
    secondary: 'h-9 rounded-[6px] border border-[#DDDDDD] bg-white px-4 text-[14px] text-[#222222] disabled:text-[#B6B6B6]',
    dark: 'h-9 rounded-[6px] bg-[#222222] px-5 text-[14px] font-medium text-white disabled:opacity-40',
    text: 'text-[14px] text-[#ED3A3A] disabled:text-[#B6B6B6]',
};

export function Button({ variant = 'secondary', className = '', ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
    return <button type="button" className={`whitespace-nowrap ${variantCls[variant]} ${className}`} {...rest} />;
}

export function ActivePill({ active }: { active: boolean }) {
    return active ? (
        <span className="inline-block rounded-full bg-[#E8F5E9] px-2.5 py-1 text-[12px] font-medium text-[#2E7D32]">운영 중</span>
    ) : (
        <span className="inline-block rounded-full bg-[#F0F0F0] px-2.5 py-1 text-[12px] font-medium text-[#8A8A8A]">중단</span>
    );
}

export type Status = { ok: boolean; text: string } | null;

export function StatusLine({ status }: { status: Status }) {
    if (!status) return null;
    return <p className={`text-[13px] ${status.ok ? 'text-[#2E7D32]' : 'text-[#ED3A3A]'}`}>{status.text}</p>;
}

export function Breadcrumb({ parent, onParent, current }: { parent: string; onParent: () => void; current: string }) {
    return (
        <p className="mb-1 text-[13px] text-[#8A8A8A]">
            <button type="button" className="hover:underline" onClick={onParent}>{parent}</button>
            <span className="mx-1.5">›</span>
            <span>{current}</span>
        </p>
    );
}

export function SectionTitle({ children, right }: { children: ReactNode; right?: ReactNode }) {
    return (
        <div className="mb-5 flex items-center justify-between">
            <h2 className="text-[22px] font-bold text-[#222222]">{children}</h2>
            {right}
        </div>
    );
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
    return <div className={`rounded-[8px] border border-[#E5E5E5] bg-white p-6 ${className}`}>{children}</div>;
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
    return (
        <div className="flex items-start gap-4">
            <label className="w-[132px] shrink-0 pt-2 text-[14px] text-[#222222]">{label}</label>
            <div className="flex-1">{children}</div>
        </div>
    );
}
