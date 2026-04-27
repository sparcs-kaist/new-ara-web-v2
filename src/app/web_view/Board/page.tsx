'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Screen } from '@/app/web_view/_components';
import { fetchBoardList } from '@/lib/api/board';
import { BoardHeader } from './_components/BoardHeader';
import { SearchTrigger } from './_components/SearchTrigger';

// Board entries are typed loosely upstream (`fetchBoardList` returns `any`),
// so we describe just the fields we touch here.
interface BoardItem {
    id: number;
    slug: string;
    ko_name: string;
    en_name?: string;
    group?: { id: number; ko_name: string; slug: string } | null;
}

export default function BoardListPage() {
    const [boards, setBoards] = useState<BoardItem[] | null>(null);

    useEffect(() => {
        let cancelled = false;
        fetchBoardList()
            .then((res) => {
                // The endpoint returns either an array or a paginated wrapper.
                const list: BoardItem[] = Array.isArray(res) ? res : (res?.results ?? []);
                if (!cancelled) setBoards(list);
            })
            .catch(() => {
                if (!cancelled) setBoards([]);
            });
        return () => {
            cancelled = true;
        };
    }, []);

    const grouped = useMemo(() => {
        if (!boards) return null;
        const map = new Map<string, { name: string; items: BoardItem[] }>();
        for (const b of boards) {
            const key = b.group?.slug ?? '__ungrouped';
            const name = b.group?.ko_name ?? '기타';
            if (!map.has(key)) map.set(key, { name, items: [] });
            map.get(key)!.items.push(b);
        }
        return Array.from(map.values());
    }, [boards]);

    return (
        <Screen>
            <BoardHeader />
            <SearchTrigger />

            {grouped === null && <ListSkeleton />}
            {grouped && grouped.length === 0 && (
                <div
                    style={{
                        padding: 'var(--ara-spacing-xl)',
                        textAlign: 'center',
                        color: 'var(--ara-text-tertiary)',
                    }}
                >
                    게시판을 불러올 수 없습니다.
                </div>
            )}
            {grouped &&
                grouped.map((group) => (
                    <section key={group.name}>
                        <div
                            style={{
                                padding: '12px var(--ara-spacing-lg) 6px',
                                fontSize: 13,
                                fontWeight: 600,
                                color: 'var(--ara-text-tertiary)',
                            }}
                        >
                            {group.name}
                        </div>
                        {group.items.map((board) => (
                            <Link
                                key={board.id}
                                href={`/web_view/Board/${board.slug}`}
                                className="ara-list-row"
                                style={{
                                    textDecoration: 'none',
                                    color: 'inherit',
                                    justifyContent: 'space-between',
                                }}
                            >
                                <span
                                    style={{
                                        fontSize: 15,
                                        fontWeight: 500,
                                        color: 'var(--ara-text-primary)',
                                    }}
                                >
                                    {board.ko_name}
                                </span>
                                <ChevronRight />
                            </Link>
                        ))}
                    </section>
                ))}
        </Screen>
    );
}

function ListSkeleton() {
    return (
        <div>
            {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="ara-list-row">
                    <div className="ara-skeleton" style={{ height: 16, width: '50%' }} />
                </div>
            ))}
        </div>
    );
}

function ChevronRight() {
    return (
        <svg
            width="16"
            height="16"
            viewBox="0 0 20 20"
            fill="none"
            aria-hidden
            style={{ color: 'var(--ara-text-tertiary)' }}
        >
            <path
                d="M7.5 4L13.5 10L7.5 16"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}
