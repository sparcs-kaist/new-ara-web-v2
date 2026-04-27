'use client';

import Link from 'next/link';
import Image from 'next/image';
import type { ResponsePost } from '@/lib/types/post';

// Loose attachment shape — `ResponsePost.attachments` isn't typed on
// `ResponsePost` directly, so we describe what we need.
interface AttachmentLike {
    file: string;
    mimetype?: string;
}

interface PosterGridProps {
    posts: ResponsePost[];
}

function findImage(attachments: unknown): AttachmentLike | undefined {
    if (!Array.isArray(attachments)) return undefined;
    return (attachments as AttachmentLike[]).find((a) => {
        if (!a) return false;
        if (a.mimetype) return a.mimetype.startsWith('image');
        return /\.(png|jpe?g|gif|webp|svg)$/i.test(a.file ?? '');
    });
}

export function PosterGrid({ posts }: PosterGridProps) {
    return (
        <div
            style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 'var(--ara-spacing-md)',
                padding: 'var(--ara-spacing-lg)',
            }}
        >
            {posts.map((post) => {
                // attachments live on the article but ResponsePost doesn't list them;
                // pull through an unknown cast.
                const img = findImage(
                    (post as unknown as { attachments?: AttachmentLike[] }).attachments,
                );
                return (
                    <Link
                        key={post.id}
                        href={`/web_view/Post/${post.id}`}
                        style={{
                            display: 'block',
                            textDecoration: 'none',
                            color: 'inherit',
                        }}
                    >
                        <div
                            style={{
                                width: '100%',
                                aspectRatio: '210/297',
                                position: 'relative',
                                overflow: 'hidden',
                                borderRadius: 'var(--ara-radius-md)',
                                border: '1px solid var(--ara-divider)',
                                background: 'var(--ara-bg-muted)',
                            }}
                        >
                            {img ? (
                                <Image
                                    src={img.file}
                                    alt={post.title}
                                    fill
                                    sizes="(max-width: 768px) 50vw, 25vw"
                                    style={{ objectFit: 'cover' }}
                                />
                            ) : (
                                <div
                                    style={{
                                        position: 'absolute',
                                        inset: 0,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'var(--ara-text-quaternary)',
                                        fontSize: 12,
                                    }}
                                >
                                    이미지 없음
                                </div>
                            )}
                        </div>
                        <div
                            style={{
                                marginTop: 8,
                                fontSize: 13,
                                fontWeight: 500,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                            }}
                            title={post.title}
                        >
                            {post.title}
                        </div>
                    </Link>
                );
            })}
        </div>
    );
}
