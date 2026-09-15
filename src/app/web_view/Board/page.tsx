'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    DownloadIcon,
    MenuIcon,
    NotifyIcon,
    RightChevronIcon,
    Screen,
    SearchIcon,
    StarIcon,
} from '@/app/web_view/_components';
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
 * - 28/700 brand-red title in the AppBar.
 * - 40px filled #F6F6F6 search trigger.
 * - "전체보기 / 인기글 / 담아둔 글" quick links — 32px tall, gry3 (#333).
 * - 1px hairline + ExpansionTiles for board groups (default open).
 * - Group 2 (자유게시판) is a single board, rendered without the expander.
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
            <header className="sticky top-[var(--ara-safe-top)] z-40 flex h-14 items-center bg-white px-5">
                <h1 className="text-[28px] font-bold text-ara_red">게시판</h1>
            </header>

            <div className="px-5">
                <button
                    type="button"
                    onClick={() => router.push('/web_view/Search')}
                    className="flex h-10 w-full items-center rounded-[10px] bg-[#F6F6F6] pl-[6px] text-left"
                >
                    <span className="inline-flex h-7 w-9 items-center justify-center text-[#9E9E9E]">
                        <SearchIcon size={20} />
                    </span>
                    <span className="text-[16px] font-medium text-[#BBBBBB]">
                        게시판, 게시글 및 댓글 검색
                    </span>
                </button>

                <div className="h-[21px]" />

                <QuickLinkRow
                    icon={<MenuIcon size={32} />}
                    label="전체보기"
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
                    label="담아둔 글"
                    onTap={() => router.push('/web_view/Board/_scraps')}
                />

                <div className="h-5" />
                <div className="h-px bg-[#F0F0F0]" />
                <div className="h-[10px]" />

                {grouped &&
                    Object.entries(grouped).map(([id, group]) => {
                        if (id === '2') {
                            const b = group.items[0];
                            if (!b) return null;
                            return (
                                <button
                                    key={id}
                                    type="button"
                                    onClick={() => router.push(`/web_view/Board/${b.id}`)}
                                    className="flex h-12 w-full items-center bg-transparent"
                                >
                                    <span className="ml-[3px] inline-flex h-8 w-8 items-center justify-center text-[#333333]">
                                        <NotifyIcon size={32} />
                                    </span>
                                    <span className="ml-[5px] text-[20px] font-bold text-[#333333]">
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
            <span className="ml-[3px] inline-flex h-8 w-8 items-center justify-center text-[#333333]">
                {icon}
            </span>
            <span className="ml-[5px] text-[17px] font-bold text-[#333333]">{label}</span>
        </button>
    );
}

function BoardGroupTile({ name, items }: { name: string; items: BoardItem[] }) {
    const router = useRouter();
    return (
        <details open className="group">
            <summary className="flex h-[39px] cursor-pointer list-none items-center [&::-webkit-details-marker]:hidden">
                <span className="ml-[3px] inline-flex h-8 w-8 items-center justify-center text-[#333333]">
                    <NotifyIcon size={32} />
                </span>
                <span className="ml-[5px] text-[20px] font-bold text-[#333333]">{name}</span>
                <span className="ml-auto text-ara_red transition-transform group-open:rotate-90 group-open:text-black">
                    <RightChevronIcon size={14} />
                </span>
            </summary>
            <div>
                {items.map((b) => (
                    <button
                        key={b.id}
                        type="button"
                        onClick={() => router.push(`/web_view/Board/${b.id}`)}
                        className="flex h-[39px] w-full items-center bg-transparent pl-[40px] text-left"
                    >
                        <span className="text-[16px] font-medium text-[#333333]">{b.ko_name}</span>
                    </button>
                ))}
            </div>
        </details>
    );
}
