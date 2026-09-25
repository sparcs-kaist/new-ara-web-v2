'use client';

import { MemberIcon } from '@/app/web_view/_components';

export function AnonAvatar({ size = 36 }: { size?: number }) {
    return (
        <span
            aria-hidden
            className="inline-flex shrink-0 items-center justify-center rounded-full bg-[#E5E5E5] text-white"
            style={{ width: size, height: size }}
        >
            <MemberIcon size={Math.round(size * 0.7)} />
        </span>
    );
}
