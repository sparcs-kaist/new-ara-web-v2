'use client';

import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import { LittleText, RightChevronIcon } from '@/app/web_view/_components';
import type { ResponsePost } from '@/lib/types/post';

interface NoticeRowProps {
    label: string;
    /** Hex colour for the label and chevron (e.g. portal=#1F4899, ara=#ED3A3A). */
    color: string;
    /** Optional leading icon (e.g. KAIST mark). */
    leading?: ReactNode;
    /** What clicking the label/header navigates to (a board slug). */
    onLabelTap?: () => void;
    post?: ResponsePost | null;
    onPostTap?: () => void;
    showTopic?: boolean;
}

/**
 * One label-plus-title row inside the notice / trade / student-community
 * box on the home page. Faithful to the `_buildNoticeContents` /
 * `_buildTradeContents` rows in `main_page.dart`.
 */
export function NoticeRow({ label, color, leading, onLabelTap, post, onPostTap, showTopic }: NoticeRowProps) {
    const router = useRouter();
    const handlePostTap = () => {
        if (onPostTap) return onPostTap();
        if (post) router.push(`/web_view/Post/${post.id}`);
    };

    return (
        <div className="flex items-center gap-[10px]">
            <button
                type="button"
                onClick={onLabelTap}
                className="flex shrink-0 items-center bg-transparent"
            >
                {leading && <span className="mr-[5px] inline-flex">{leading}</span>}
                <span className="text-[14px] font-bold" style={{ color }}>
                    {label}
                </span>
                <span className="ml-[5px] inline-flex" style={{ color }}>
                    <RightChevronIcon size={17} />
                </span>
            </button>
            {post && (
                <button
                    type="button"
                    onClick={handlePostTap}
                    className="min-w-0 flex-1 bg-transparent text-left"
                >
                    <LittleText post={post} showTopic={showTopic} />
                </button>
            )}
        </div>
    );
}
