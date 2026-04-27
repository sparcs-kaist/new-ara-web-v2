'use client';

import { useRouter } from 'next/navigation';
import type { PostData } from '@/lib/types/post';
import { CommentIcon, DislikeIcon, LikeIcon, RightChevronIcon } from '@/app/web_view/_components';

interface ArticleHeaderProps {
    post: PostData;
}

/**
 * Faithful port of `_buildTitle` + `_buildAuthorInfo` from
 * `lib/pages/post_view_page.dart`.
 *
 *   [topic] title  (red 18/w700  +  black 18/w700)
 *   {time}   조회 N            ▲ pos  ▼ neg  💬 comments
 *   ──────────────────────────────────────────────
 *   ⚪ {nickname} ›
 *   ─── divider ───
 */
export function ArticleHeader({ post }: ArticleHeaderProps) {
    const router = useRouter();

    const isAnonymous = post.name_type !== 1;
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    const topic = (post as any)?.parent_topic?.ko_name ?? '';

    const onAuthorClick = () => {
        if (isAnonymous) return;
        router.push(`/web_view/User/${post.created_by.id}`);
    };

    const positive = post.positive_vote_count ?? 0;
    const negative = post.negative_vote_count ?? 0;
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    const comments = (post as any).comment_count ?? post.comments?.length ?? 0;
    const myVote = post.my_vote;

    return (
        <section className="px-5 pt-2">
            {/* Title row: [topic] + title (18/w700) */}
            <h2 className="m-0 break-words text-[18px] font-bold leading-snug">
                {topic && <span className="text-ara_red">[{topic}] </span>}
                <span className="text-black">{post.title}</span>
            </h2>

            {/* meta row: date/hit on left, like/dislike/comment on right */}
            <div className="mt-[5px] flex items-center justify-between">
                <div className="flex items-center gap-[10px] text-[12px] font-medium text-[#B1B1B1]">
                    <span>{formatTime(post.created_at)}</span>
                    <span>조회 {post.hit_count ?? 0}</span>
                </div>
                <div className="flex items-center text-[#636363]">
                    <span
                        className={`flex items-center ${
                            myVote === true ? 'text-ara_red' : 'text-[#BBBBBB]'
                        }`}
                    >
                        <LikeIcon size={11} />
                        <span className="ml-[2px] text-[12px] font-medium">{positive}</span>
                    </span>
                    <span
                        className={`ml-[10px] flex items-center ${
                            myVote === false ? 'text-ara_blue' : 'text-[#BBBBBB]'
                        }`}
                    >
                        <DislikeIcon size={11} />
                        <span className="ml-[2px] text-[12px] font-medium">{negative}</span>
                    </span>
                    <span className="ml-[10px] flex items-center text-[#636363]">
                        <CommentIcon size={12} />
                        <span className="ml-[2px] text-[12px] font-medium">{comments}</span>
                    </span>
                </div>
            </div>

            {/* author row: avatar + nickname + chevron (only for non-anonymous) */}
            <button
                type="button"
                onClick={onAuthorClick}
                disabled={isAnonymous}
                className="mt-[10px] flex w-full items-center bg-transparent text-left disabled:cursor-default"
            >
                <span
                    className="inline-flex h-[30px] w-[30px] shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#E5E5E5]"
                    aria-hidden
                >
                    {post.created_by?.profile?.picture && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={post.created_by.profile.picture}
                            alt=""
                            className="h-full w-full object-cover"
                        />
                    )}
                </span>
                <span className="ml-[10px] truncate text-[14px] font-medium text-black">
                    {post.created_by?.profile?.nickname ?? ''}
                </span>
                {!isAnonymous && (
                    <span className="ml-[10px] inline-flex shrink-0 items-center text-black">
                        <RightChevronIcon size={14} />
                    </span>
                )}
            </button>

            {/* hairline */}
            <div className="mt-[10px] h-px w-full bg-[#F0F0F0]" />
        </section>
    );
}

function formatTime(iso?: string | null): string {
    if (!iso) return '';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const mi = String(d.getMinutes()).padStart(2, '0');
    return `${yyyy}.${mm}.${dd} ${hh}:${mi}`;
}
