'use client';

/** 43×27 Cupertino-style switch with brand red active state. */
export function Toggle({
    checked,
    onChange,
    disabled = false,
}: {
    checked: boolean;
    onChange: (v: boolean) => void;
    disabled?: boolean;
}) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            disabled={disabled}
            onClick={() => !disabled && onChange(!checked)}
            className={[
                'relative h-[27px] w-[43px] rounded-full p-0 transition-colors',
                checked ? 'bg-ara_red' : 'bg-[#E5E5E5]',
                disabled ? 'cursor-not-allowed' : '',
            ].join(' ')}
        >
            <span
                aria-hidden
                className="absolute top-[2px] block h-[23px] w-[23px] rounded-full bg-white shadow transition-[left]"
                style={{ left: checked ? 18 : 2 }}
            />
        </button>
    );
}
