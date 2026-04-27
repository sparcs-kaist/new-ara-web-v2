'use client';

import Link from 'next/link';
import Image from 'next/image';
import type { ResponsePost } from '@/lib/types/post';

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

/** Two-column poster grid for the 포스터 board. */
export function PosterGrid({ posts }: PosterGridProps) {
    return (
        <div className="grid grid-cols-2 gap-3 px-5">
            {posts.map((post) => {
                const img = findImage(
                    (post as unknown as { attachments?: AttachmentLike[] }).attachments,
                );
                return (
                    <Link
                        key={post.id}
                        href={`/web_view/Post/${post.id}`}
                        className="block text-inherit no-underline"
                    >
                        <div
                            className="relative w-full overflow-hidden rounded-[10px] bg-[#F8F8F8]"
                            style={{ aspectRatio: '210/297' }}
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
                                <div className="absolute inset-0 flex items-center justify-center text-[12px] text-[#B1B1B1]">
                                    이미지 없음
                                </div>
                            )}
                        </div>
                        <div
                            className="mt-2 truncate text-[13px] font-medium text-black"
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
