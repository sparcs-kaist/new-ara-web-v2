'use client';

import { useRouter } from 'next/navigation';
import { formatDate } from '@/app/post/util/formatDate';
import type { PostData } from '@/lib/types/post';

interface ArticleHeaderProps {
    post: PostData;
}

/**
 * Top section of the post detail screen: board/topic pill, title, author row,
 * date, view count, and comment count.
 */
export function ArticleHeader({ post }: ArticleHeaderProps) {
    const router = useRouter();

    // name_type === 1 means nickname is shown (clickable profile).
    const isAnonymous = post.name_type !== 1;
    const board = post.parent_board?.ko_name ?? '';
    // ParseTopic — the `parent_topic` field is on the article when present.
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    const topic = (post as any)?.parent_topic?.ko_name ?? '';

    const onAuthorClick = () => {
        if (isAnonymous) return;
        router.push(`/web_view/User/${post.created_by.id}`);
    };

    return (
        <section
            style={{
                padding: '16px var(--ara-spacing-lg)',
                borderBottom: '1px solid var(--ara-divider)',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
            }}
        >
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {board && <span className="ara-pill">{board}</span>}
                {topic && <span className="ara-pill ara-pill--primary">{topic}</span>}
            </div>

            <h2
                style={{
                    margin: 0,
                    fontSize: 18,
                    fontWeight: 700,
                    lineHeight: 1.4,
                    color: 'var(--ara-text-primary)',
                    wordBreak: 'break-word',
                }}
            >
                {post.title}
            </h2>

            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    flexWrap: 'wrap',
                    fontSize: 12,
                    color: 'var(--ara-text-tertiary)',
                }}
            >
                <span
                    onClick={onAuthorClick}
                    role={isAnonymous ? undefined : 'button'}
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        color: 'var(--ara-text-secondary)',
                        cursor: isAnonymous ? 'default' : 'pointer',
                    }}
                >
                    {post.created_by?.profile?.picture && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={post.created_by.profile.picture}
                            alt=""
                            width={20}
                            height={20}
                            style={{ borderRadius: '50%', objectFit: 'cover' }}
                        />
                    )}
                    <span>{post.created_by?.profile?.nickname ?? ''}</span>
                </span>
                <span aria-hidden>·</span>
                <span>{formatDate(post.created_at)}</span>
                <span aria-hidden>·</span>
                <span>조회 {post.hit_count ?? 0}</span>
                <span aria-hidden>·</span>
                <span>댓글 {post.comments?.length ?? 0}</span>
            </div>
        </section>
    );
}
