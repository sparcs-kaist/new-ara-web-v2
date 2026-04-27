'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Screen, MenuIcon, StarIcon, DownloadIcon, SearchIcon, NotifyIcon } from '@/app/web_view/_components';
import { fetchBoardList } from '@/lib/api/board';

interface BoardItem {
    id: number;
    slug: string;
    ko_name: string;
    en_name?: string;
    group?: { id: number; slug: string; ko_name: string } | null;
}

/**
 * Mirrors `lib/pages/board_list_page.dart`.
 *
 * - 28/700 brand-red title in the AppBar (this is the "게시판" header that
 *   our previous build was rendering in 22/black instead).
 * - Search field row (filled #F0F0F0).
 * - Three quick links: 전체 보기 / 인기글 / 스크랩.
 * - 1px divider, then board groups (each expandable, default open).
 * - Group 2 is the standalone 자유게시판 board.
 */
export default function BoardListPage() {
    const router = useRouter();
    const [boards, setBoards] = useState<BoardItem[] | null>(null);

    useEffect(() => {
        let cancelled = false;
        fetchBoardList()
            .then((res) => {
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
        const groups: Record<number, { name: string; items: BoardItem[] }> = {};
        for (const b of boards) {
            const g = b.group;
            if (!g) continue;
            if (!groups[g.id]) groups[g.id] = { name: g.ko_name, items: [] };
            groups[g.id].items.push(b);
        }
        return groups;
    }, [boards]);

    return (
        <Screen>
            {/* AppBar */}
            <header className="sticky top-0 z-40 flex h-14 items-center bg-white px-5">
                <h1 className="text-[28px] font-bold text-ara_red">게시판</h1>
            </header>

            <div className="px-5">
                {/* Search trigger */}
                <button
                    type="button"
                    onClick={() => router.push('/web_view/Search')}
                    className="flex h-10 w-full items-center rounded-[10px] bg-[#F0F0F0] px-2 text-left"
                >
                    <span className="mr-1 inline-flex h-7 w-9 items-center justify-center text-[#9E9E9E]">
                        <SearchIcon size={20} />
                    </span>
                    <span className="text-[16px] font-medium text-[#9E9E9E]">
                        게시판/게시물/댓글을 검색하세요
                    </span>
                </button>

                <div className="h-[21px]" />

                <QuickLinkRow
                    icon={<MenuIcon size={32} />}
                    label="전체 보기"
                    onTap={() => router.push('/web_view/Board/_all')}
                />
                <div className="h-[10px]" />
                <QuickLinkRow
                    icon={<StarIcon size={32} />}
                    label="인기글"
                    onTap={() => router.push('/web_view/Board/_top')}
                />
                <div className="h-[10px]" />
                <QuickLinkRow
                    icon={<DownloadIcon size={32} />}
                    label="스크랩"
                    onTap={() => router.push('/web_view/Board/_scraps')}
                />

                <div className="h-5" />
                <div className="h-px bg-[#F0F0F0]" />
                <div className="h-[10px]" />

                {grouped &&
                    Object.entries(grouped).map(([id, group]) => {
                        if (id === '2') {
                            // 자유게시판 — single board, not expandable.
                            const b = group.items[0];
                            if (!b) return null;
                            return (
                                <button
                                    key={id}
                                    type="button"
                                    onClick={() => router.push(`/web_view/Board/${b.slug}`)}
                                    className="flex h-12 w-full items-center bg-transparent"
                                >
                                    <span className="ml-[3px] inline-flex h-8 w-8 items-center justify-center text-[#666666]">
                                        <NotifyIcon size={32} />
                                    </span>
                                    <span className="ml-[5px] text-[20px] font-bold text-[#666666]">
                                        {b.ko_name}
                                    </span>
                                </button>
                            );
                        }
                        return <BoardGroupTile key={id} name={group.name} items={group.items} />;
                    })}
            </div>
        </Screen>
    );
}

function QuickLinkRow({ icon, label, onTap }: { icon: React.ReactNode; label: string; onTap: () => void }) {
    return (
        <button
            type="button"
            onClick={onTap}
            className="flex h-8 w-full items-center bg-transparent"
        >
            <span className="ml-[3px] inline-flex h-8 w-8 items-center justify-center text-[#666666]">
                {icon}
            </span>
            <span className="ml-[5px] text-[17px] font-bold text-[#666666]">{label}</span>
        </button>
    );
}

function BoardGroupTile({ name, items }: { name: string; items: BoardItem[] }) {
    const router = useRouter();
    return (
        <details open className="group">
            <summary className="flex h-[39px] cursor-pointer list-none items-center [&::-webkit-details-marker]:hidden">
                <span className="ml-[3px] inline-flex h-8 w-8 items-center justify-center text-[#666666]">
                    <NotifyIcon size={32} />
                </span>
                <span className="ml-[5px] text-[20px] font-bold text-[#666666]">{name}</span>
                <span className="ml-auto text-ara_red transition-transform group-open:rotate-90 group-open:text-black">
                    <svg width="14" height="14" viewBox="0 0 32 32" fill="none">
                        <path
                            d="M12 8L20 16L12 24"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                </span>
            </summary>
            <div>
                {items.map((b) => (
                    <button
                        key={b.id}
                        type="button"
                        onClick={() => router.push(`/web_view/Board/${b.slug}`)}
                        className="flex h-[39px] w-full items-center bg-transparent pl-[40px] text-left"
                    >
                        <span className="text-[16px] font-medium text-[#666666]">{b.ko_name}</span>
                    </button>
                ))}
            </div>
        </details>
    );
}
