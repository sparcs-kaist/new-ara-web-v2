'use client';

import { useEffect, useRef, useState } from 'react';

const expandMotion = 'duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]';

interface ExpandSelectOption {
    value: string;
    label: string;
}

interface ExpandSelectProps {
    options: ExpandSelectOption[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
    className?: string;
    boxClassName?: string;
    itemClassName?: string;
}

export default function ExpandSelect({
    options,
    value,
    onChange,
    placeholder,
    disabled = false,
    className = '',
    boxClassName = '',
    itemClassName = '',
}: ExpandSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (disabled) setIsOpen(false);
    }, [disabled]);

    const selected = value === '' && placeholder ? undefined : options.find((option) => option.value === value);
    const restOptions = options.filter((option) => option.value !== value);
    const isPlaceholder = disabled || !selected;

    return (
        <div className={`relative ${className}`} ref={containerRef}>
            {/* 닫힌 pill 의 윗면은 그대로 두고 아래로만 늘어나도록 높이만 풀어 준다 */}
            <div className={`absolute top-0 left-0 w-full z-50 overflow-hidden ${boxClassName}`}>
                <button
                    type="button"
                    className={`relative block w-full truncate px-3.5 pr-8 py-2 text-left ${isPlaceholder ? 'text-[#BBBBBB]' : ''} ${disabled ? 'cursor-default' : 'cursor-pointer'} ${itemClassName}`}
                    disabled={disabled}
                    onClick={() => {
                        if (restOptions.length === 0) return;
                        setIsOpen((prev) => !prev);
                    }}
                >
                    {selected ? selected.label : placeholder}
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 leading-none pointer-events-none">
                        <svg
                            width="10"
                            height="6"
                            viewBox="0 0 10 6"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            className={`transition-transform ${expandMotion} ${isOpen ? 'rotate-180' : ''}`}
                        >
                            <path
                                d="M4.76856 6.00426L3.80093e-05 0.00853585L9.52631 -8.01353e-06L4.76856 6.00426Z"
                                fill="currentColor"
                            />
                        </svg>
                    </span>
                </button>

                <div
                    className={`grid transition-[grid-template-rows] ${expandMotion} ${isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
                >
                    <div
                        className={`overflow-hidden transition-[opacity,transform] ${expandMotion} ${isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}`}
                    >
                        {restOptions.map((option) => (
                            <button
                                key={option.value}
                                type="button"
                                className={`block w-full truncate px-3.5 py-2 border-t border-[#F0F0F0] text-left ${itemClassName}`}
                                onClick={() => {
                                    onChange(option.value);
                                    setIsOpen(false);
                                }}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
