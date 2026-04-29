'use client';

import './Skeleton.css';

interface SkeletonProps {
    /** Tailwind classes for sizing/positioning. */
    className?: string;
}

/** Light-grey shimmer block — single source of truth for "loading…" UI. */
export function Skeleton({ className = '' }: SkeletonProps) {
    return <div aria-hidden className={`ara-skeleton ${className}`} />;
}

/** Two-line preview row — title + 1 meta line (matches PopularBoardRow). */
export function SkeletonRow() {
    return (
        <div className="flex w-full items-start gap-[15px] p-[10px]">
            <div className="min-w-0 flex-1">
                <Skeleton className="h-[15px] w-[80%] rounded" />
                <div className="h-[6px]" />
                <Skeleton className="h-[12px] w-[40%] rounded" />
            </div>
        </div>
    );
}

/** Single-line preview row — for NoticeRow / StudentRow. */
export function SkeletonLine() {
    return (
        <div className="flex items-center">
            <Skeleton className="h-[14px] w-[68%] rounded" />
        </div>
    );
}
