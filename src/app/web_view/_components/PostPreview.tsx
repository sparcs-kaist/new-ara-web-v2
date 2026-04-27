'use client';

import type { ResponsePost } from '@/lib/types/post';
import { ClipBadgeIcon, CommentIcon, DislikeIcon, ImageBadgeIcon, LikeIcon } from './icons';

interface PostPreviewProps {
    post: ResponsePost;
}

/**
 * Faithful port of `lib/widgets/post_preview.dart` from the Flutter app.
 *
 * Two rows:
 *   - title row (24px tall): `[topic] ` (red 16/w500) + title (16/w500),
 *     followed by optional image/clip attachment badges.
 *   - meta row: nickname + time on the left, like / dislike / comment
 *     counts on the right (each only when the count is non-zero, with
 *     the same SVG and colours the Flutter source uses).
 *
 * The widget renders just the row; tap handling is the parent's job.
 */
export function PostPreview({ post }: PostPreviewProps) {
    const topicName = post.parent_topic?.ko_name ?? '';
    const isHidden = Boolean((post as unknown as { is_hidden?: boolean }).is_hidden);
    const author = post.created_by?.profile?.nickname ?? '익명';
    const time = formatTime(post.created_at);
    const positive = post.positive_vote_count ?? 0;
    const negative = post.negative_vote_count ?? 0;
    const comments = post.comment_count ?? 0;
    const attachmentType = (post as unknown as { attachment_type?: string }).attachment_type;

    return (
        <div className="flex flex-col">
            {/* Title row */}
            <div className="flex h-6 items-center">
                {topicName && (
                    <span className="shrink-0 text-[16px] font-medium text-ara_red">
                        [{topicName}]&nbsp;
                    </span>
                )}
                <span
                    className={[
                        'min-w-0 flex-1 truncate text-[16px] font-medium',
                        isHidden ? 'text-[#B1B1B1]' : 'text-black',
                    ].join(' ')}
                >
                    {post.title}
                </span>
                {attachmentType === 'BOTH' && (
                    <span className="ml-1 flex shrink-0 items-center gap-0.5 text-[#9E9E9E]">
                        <ImageBadgeIcon size={14} />
                        <ClipBadgeIcon size={14} />
                    </span>
                )}
                {attachmentType === 'IMAGE' && (
                    <span className="ml-1 shrink-0 text-[#9E9E9E]">
                        <ImageBadgeIcon size={14} />
                    </span>
                )}
                {attachmentType === 'NON_IMAGE' && (
                    <span className="ml-1 shrink-0 text-[#9E9E9E]">
                        <ClipBadgeIcon size={14} />
                    </span>
                )}
            </div>

            {/* Meta row */}
            <div className="mt-0.5 flex items-center">
                <div className="flex min-w-0 flex-1 items-center gap-2 text-[12px] text-[#B1B1B1]">
                    <span className="truncate">{author}</span>
                    <span className="shrink-0">{time}</span>
                </div>
                <div className="flex shrink-0 items-center">
                    {positive > 0 && (
                        <span className="flex items-center text-ara_red">
                            <LikeIcon size={10} />
                            <span className="ml-[2px] text-[12px] font-medium">{positive}</span>
                        </span>
                    )}
                    {negative > 0 && (
                        <span className={`flex items-center text-ara_blue ${positive > 0 ? 'ml-2' : ''}`}>
                            <DislikeIcon size={10} />
                            <span className="ml-[2px] text-[12px] font-medium">{negative}</span>
                        </span>
                    )}
                    {comments > 0 && (
                        <span className={`flex items-center text-[#636363] ${positive > 0 || negative > 0 ? 'ml-2' : ''}`}>
                            <CommentIcon size={12} />
                            <span className="ml-[3px] text-[12px] font-medium">{comments}</span>
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}

/** Compact "n분 전" / "n시간 전" / "n일 전" / "yyyy-MM-dd" formatter. */
function formatTime(iso?: string | null): string {
    if (!iso) return '';
    const t = new Date(iso).getTime();
    if (isNaN(t)) return '';
    const diffSec = Math.max(0, Math.floor((Date.now() - t) / 1000));
    if (diffSec < 60) return '방금';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}분 전`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}시간 전`;
    if (diffSec < 86400 * 7) return `${Math.floor(diffSec / 86400)}일 전`;
    const d = new Date(iso);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}
