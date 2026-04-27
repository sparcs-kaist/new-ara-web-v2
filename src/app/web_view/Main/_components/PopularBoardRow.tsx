'use client';

import { useRouter } from 'next/navigation';
import { PostPreview } from '@/app/web_view/_components';
import type { ResponsePost } from '@/lib/types/post';

interface PopularBoardRowProps {
    post: ResponsePost;
    /** Show the rank badge (red, 22px, bold) on the left. */
    rank?: number;
}

/**
 * Mirrors `PopularBoard` in `main_page.dart`: optional rank badge plus
 * `PostPreview`, both inside a 10px-padding tappable container that
 * navigates to the post detail.
 */
export function PopularBoardRow({ post, rank }: PopularBoardRowProps) {
    const router = useRouter();
    return (
        <button
            type="button"
            onClick={() => router.push(`/web_view/Post/${post.id}`)}
            className="flex w-full items-center gap-[15px] bg-transparent p-[10px] text-left"
        >
            {typeof rank === 'number' && (
                <span className="w-[13px] shrink-0 text-center text-[22px] font-bold leading-none text-ara_red">
                    {rank}
                </span>
            )}
            <span className="min-w-0 flex-1">
                <PostPreview post={post} />
            </span>
        </button>
    );
}
