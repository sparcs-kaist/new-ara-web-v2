'use client';

import React from 'react';
import { CheckIcon } from './icons';

interface WriteCheckRowProps {
    showAnonymous: boolean;
    anonymous: boolean;
    social: boolean;
    sexual: boolean;
    onChangeAnonymous: (value: boolean) => void;
    onChangeSocial: (value: boolean) => void;
    onChangeSexual: (value: boolean) => void;
    realnameNotice?: boolean;
    disabled?: boolean;
}

/**
 * Flutter `_buildCheckBox` (post_write_page.dart 1332-1495): 20×20 / radius 5
 * 박스에 흰 체크, 켜지면 브랜드 레드 · 꺼지면 #F0F0F0, 라벨은 16/500.
 */
function CheckItem({
    checked,
    label,
    onToggle,
    disabled,
}: {
    checked: boolean;
    label: string;
    onToggle: () => void;
    disabled?: boolean;
}) {
    return (
        <button
            type="button"
            onClick={onToggle}
            disabled={disabled}
            aria-pressed={checked}
            className="flex items-center gap-[6px]"
        >
            <span
                className={`flex h-[20px] w-[20px] items-center justify-center rounded-[5px] text-white ${checked ? 'bg-ara_red' : 'bg-[#F0F0F0]'}`}
            >
                <CheckIcon size={16} />
            </span>
            <span
                className={`text-[16px] font-medium ${checked ? 'text-ara_red' : 'text-[#BBBBBB]'}`}
            >
                {label}
            </span>
        </button>
    );
}

export function WriteCheckRow({
    showAnonymous,
    anonymous,
    social,
    sexual,
    onChangeAnonymous,
    onChangeSocial,
    onChangeSexual,
    realnameNotice = false,
    disabled = false,
}: WriteCheckRowProps) {
    if (realnameNotice) {
        return (
            <div className="px-[20px]">
                <span className="text-[16px] font-medium text-ara_red">실명제 게시판입니다</span>
            </div>
        );
    }

    return (
        <div className="flex flex-wrap items-center gap-[15px] px-[20px]">
            {showAnonymous && (
                <CheckItem
                    checked={anonymous}
                    label="익명"
                    onToggle={() => onChangeAnonymous(!anonymous)}
                    disabled={disabled}
                />
            )}
            <CheckItem
                checked={sexual}
                label="성인"
                onToggle={() => onChangeSexual(!sexual)}
                disabled={disabled}
            />
            <CheckItem
                checked={social}
                label="정치"
                onToggle={() => onChangeSocial(!social)}
                disabled={disabled}
            />
        </div>
    );
}

export default WriteCheckRow;
