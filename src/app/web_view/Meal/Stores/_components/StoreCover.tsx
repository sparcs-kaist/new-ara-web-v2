'use client';

import Image from 'next/image';
import { ImageBadgeIcon } from '@/app/web_view/_components';

export function StoreCover({
    src,
    alt,
    sizes,
    iconSize = 24,
    priority = false,
    className = '',
}: {
    src: string | null;
    alt: string;
    sizes: string;
    iconSize?: number;
    priority?: boolean;
    className?: string;
}) {
    return (
        <span className={`relative block overflow-hidden bg-[#F0F0F0] ${className}`}>
            {src ? (
                <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className="object-cover" />
            ) : (
                <span className="flex h-full w-full items-center justify-center text-[#BBBBBB]">
                    <ImageBadgeIcon size={iconSize} />
                </span>
            )}
        </span>
    );
}
