'use client';

import { useEffect, useRef, useState, type ChangeEvent, type ReactNode, type TextareaHTMLAttributes } from 'react';
import { RightChevronIcon, Toggle } from '@/app/web_view/_components';
import { INPUT_CLASS } from '@/app/web_view/Delivery/_components/fields';
import { ZONE_LABELS, type Zone } from '@/lib/types/store';

export function FieldLabel({ children }: { children: ReactNode }) {
    return <span className="mb-2 block text-[12px] text-[#8A8A8A]">{children}</span>;
}

export function Field({ label, as = 'label', children }: { label: string; as?: 'label' | 'div'; children: ReactNode }) {
    const Tag = as;
    return (
        <Tag className="block">
            <FieldLabel>{label}</FieldLabel>
            {children}
        </Tag>
    );
}

export function CounterTextarea({ value, maxLength, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement> & { value: string; maxLength: number }) {
    return (
        <span className="relative block">
            <textarea
                value={value}
                maxLength={maxLength}
                {...rest}
                className="w-full resize-none rounded-[10px] bg-[#F6F6F6] px-4 pb-7 pt-3 text-[15px] text-black placeholder:text-[#BBBBBB] focus:outline-none"
            />
            <span className="pointer-events-none absolute bottom-3 right-3 text-[12px] text-[#BBBBBB]">
                {value.length}/{maxLength}
            </span>
        </span>
    );
}

export function ZoneSelect({ value, onChange }: { value: Zone; onChange: (zone: Zone) => void }) {
    return (
        <span className="relative block">
            <select name="zone" value={value} onChange={(e) => onChange(e.target.value as Zone)} className={`${INPUT_CLASS} appearance-none pr-10`}>
                {(Object.keys(ZONE_LABELS) as Zone[]).map((z) => (
                    <option key={z} value={z}>
                        {ZONE_LABELS[z]}
                    </option>
                ))}
            </select>
            <RightChevronIcon size={18} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 rotate-90 text-[#646464]" />
        </span>
    );
}

export function ChevronRow({ label, value, onClick }: { label: string; value: string; onClick: () => void }) {
    return (
        <button type="button" onClick={onClick} className="flex h-[52px] w-full items-center justify-between text-left">
            <span className="shrink-0 text-[16px] font-medium text-[#222222]">{label}</span>
            <span className="flex min-w-0 items-center pl-4 text-[13px] text-[#646464]">
                <span className="truncate">{value}</span>
                <RightChevronIcon size={16} className="ml-1 shrink-0 text-[#BBBBBB]" />
            </span>
        </button>
    );
}

export function ToggleRow({
    label,
    helper,
    checked,
    onChange,
    disabled = false,
    size = 16,
}: {
    label: string;
    helper?: string;
    checked: boolean;
    onChange: (v: boolean) => void;
    disabled?: boolean;
    size?: 15 | 16;
}) {
    return (
        <div className="flex items-center justify-between py-3">
            <div className="min-w-0 pr-4">
                <p className={`font-medium text-[#222222] ${size === 16 ? 'text-[16px]' : 'text-[15px]'}`}>{label}</p>
                {helper && <p className="mt-1 text-[12px] text-[#8A8A8A]">{helper}</p>}
            </div>
            <Toggle checked={checked} onChange={onChange} disabled={disabled} />
        </div>
    );
}

export function DashedButton({ children, onClick }: { children: ReactNode; onClick: () => void }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="flex h-[52px] w-full items-center justify-center rounded-[12px] border border-dashed border-[#F0F0F0] text-[15px] text-[#8A8A8A]"
        >
            {children}
        </button>
    );
}

export function usePickedFile(maxBytes?: number) {
    const [picked, setPicked] = useState<{ file: File; url: string } | null>(null);
    const [error, setError] = useState<string | null>(null);
    const ref = useRef<HTMLInputElement>(null);

    useEffect(() => () => {
        if (picked) URL.revokeObjectURL(picked.url);
    }, [picked]);

    const onChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file) return;
        if (maxBytes && file.size > maxBytes) {
            setError(`${Math.round(maxBytes / 1_048_576)}MB 이하 사진만 올릴 수 있어요`);
            return;
        }
        setError(null);
        setPicked({ file, url: URL.createObjectURL(file) });
    };

    return {
        picked,
        error,
        open: () => ref.current?.click(),
        inputProps: { ref, type: 'file', accept: 'image/*', className: 'hidden', onChange } as const,
    };
}
