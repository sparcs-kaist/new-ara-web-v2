'use client';

import Link from 'next/link';
import type { ResponsePost } from '@/lib/types/post';

interface ArticleRowProps {
    post: ResponsePost;
    /** Show the board name beside the meta line (used in feeds that mix boards). */
    showBoard?: boolean;
    /** Show a leading rank index (1-based). */
    rank?: number;
}

/**
 * A single article row styled to feel native. Tapping the row pushes
 * `/web_view/Post/{id}` so it works inside the WebView shell. We render our
 * own row instead of reusing `@/components/ArticleList/ArticleList` because
 * that component hardcodes `/post/{id}` hrefs.
 */
export function ArticleRow({ post, showBoard, rank }: ArticleRowProps) {
    const author = post.created_by?.profile?.nickname ?? '익명';
    const boardName = post.parent_board?.ko_name ?? '';
    const topicName = post.parent_topic?.ko_name ?? '';

    return (
        <Link
            href={`/web_view/Post/${post.id}`}
            className="ara-list-row"
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--ara-spacing-md)',
                textDecoration: 'none',
                color: 'inherit',
            }}
        >
            {typeof rank === 'number' && (
                <span
                    style={{
                        color: 'var(--ara-primary)',
                        fontWeight: 700,
                        fontSize: 18,
                        width: 20,
                        flexShrink: 0,
                        textAlign: 'center',
                    }}
                >
                    {rank}
                </span>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
                <div
                    style={{
                        fontSize: 15,
                        fontWeight: 500,
                        color: 'var(--ara-text-primary)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                    }}
                    title={post.title}
                >
                    {topicName && (
                        <span style={{ color: 'var(--ara-primary)', marginRight: 4 }}>
                            [{topicName}]
                        </span>
                    )}
                    {post.title}
                </div>
                <div
                    style={{
                        marginTop: 4,
                        fontSize: 12,
                        color: 'var(--ara-text-tertiary)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        overflow: 'hidden',
                        whiteSpace: 'nowrap',
                    }}
                >
                    {showBoard && boardName && (
                        <>
                            <span
                                style={{
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    maxWidth: 120,
                                }}
                            >
                                {boardName}
                            </span>
                            <span aria-hidden>·</span>
                        </>
                    )}
                    <span
                        style={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            maxWidth: 120,
                        }}
                    >
                        {author}
                    </span>
                    <span aria-hidden>·</span>
                    <span>댓 {post.comment_count ?? 0}</span>
                    <span aria-hidden>·</span>
                    <span>
                        ▲ {post.positive_vote_count ?? 0}
                    </span>
                </div>
            </div>
        </Link>
    );
}

export function ArticleRowSkeleton() {
    return (
        <div
            className="ara-list-row"
            style={{ display: 'flex', flexDirection: 'column', gap: 6 }}
        >
            <div className="ara-skeleton" style={{ height: 16, width: '70%' }} />
            <div className="ara-skeleton" style={{ height: 12, width: '40%' }} />
        </div>
    );
}
