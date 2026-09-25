'use client';

import { MemberIcon } from '@/app/web_view/_components';

/** Avatar for anonymous room members, who have no profile picture. */
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
