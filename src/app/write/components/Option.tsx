"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import DropdownArrowDown from '@/assets/Icon/dropdown-arrow-down.svg';

interface OptionSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: { value: string | number; label: string }[];
  placeholder?: string;
}

export const OptionSelect: React.FC<OptionSelectProps> = ({ options, placeholder, className, ...props }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative flex-shrink-0">
      <select
        className={`appearance-none px-3 py-2 pr-8 border border-gray-300 rounded whitespace-nowrap text-black disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed ${className}`}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setIsOpen(false)}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <span
        className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 transition-transform duration-200"
        style={{ transform: isOpen ? 'translateY(-50%) rotate(180deg)' : 'translateY(-50%) rotate(0deg)' }}
      >
        <Image src={DropdownArrowDown} alt="arrow" width={16} height={16} className="w-4 h-4" />
      </span>
    </div>
  );
};

interface OptionCheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export const OptionCheckbox: React.FC<OptionCheckboxProps> = ({ label, disabled, ...props }) => {
  return (
    <label className="flex items-center gap-1 text-sm whitespace-nowrap flex-shrink-0">
      <input
        type="checkbox"
        className={`accent-red-500 flex-shrink-0 ${disabled ? 'cursor-not-allowed' : ''}`}
        disabled={disabled}
        {...props}
      />
      {label}
    </label>
  );
};