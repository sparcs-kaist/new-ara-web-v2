'use client';

import type { ReactNode } from 'react';
import { RightChevronIcon } from '@/app/web_view/_components/icons';

/**
 * "실시간 인기 글 ›" / "자유게시판 ›" / "동아리 ›" — the small
 * tappable section heading on the Main page. fontSize 20 / w600 black,
 * with the right chevron rendered at 22px.
 */
export function MainPageTextButton({
    label,
    onPress,
    trailing,
}: {
    label: ReactNode;
    onPress?: () => void;
    trailing?: ReactNode;
}) {
    return (
        <button
            type="button"
            onClick={onPress}
            className="flex w-full items-center bg-transparent px-5 text-left"
        >
            <span className="flex items-center text-[20px] font-semibold text-black">
                {label}
                <span className="ml-[6.56px] inline-flex">
                    <RightChevronIcon size={22} className="text-black" />
                </span>
            </span>
            {trailing && <span className="ml-auto">{trailing}</span>}
        </button>
    );
}
