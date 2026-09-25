'use client';

export const INPUT_CLASS =
    'h-12 w-full rounded-[10px] bg-[#F6F6F6] px-4 text-[15px] text-black placeholder:text-[#BBBBBB] focus:outline-none';

export function NumberInput({
    value,
    onChange,
    placeholder,
    unit,
}: {
    value: string;
    onChange: (digits: string) => void;
    placeholder: string;
    unit: string;
}) {
    return (
        <label className="flex h-12 items-center rounded-[10px] bg-[#F6F6F6] px-4">
            <input
                inputMode="numeric"
                value={value && Number(value).toLocaleString('ko-KR')}
                onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 9))}
                placeholder={placeholder}
                className="min-w-0 flex-1 bg-transparent text-[15px] text-black placeholder:text-[#BBBBBB] focus:outline-none"
            />
            {value && <span className="ml-1 shrink-0 text-[15px] text-black">{unit}</span>}
        </label>
    );
}
