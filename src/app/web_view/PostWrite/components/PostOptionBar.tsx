//PostOptionBar.tsx
'use client';

import React from 'react';
import { ChevronDownIcon } from './icons';

interface ApiBoard {
    id: number;
    ko_name: string;
    name_type: number; // 1=Regular, 3=Regular+Anonymous, 4=Realname only
    topics: Array<{ id: number; ko_name: string }>;
}

interface PostOptionBarProps {
    boards: ApiBoard[];
    boardId: number | null;
    topicId: string;
    onChangeBoard: (boardId: number) => void;
    onChangeCategory: (category: string) => void;
    disabled?: boolean;
    isEditMode?: boolean;
}

const PILL =
    'h-[34px] w-full appearance-none rounded-[20px] bg-[#F8F8F8] pl-[15px] pr-[28px] text-[16px] font-medium leading-[34px] focus:outline-none';

/**
 * Flutter `_buildMenubar` (post_write_page.dart 785-910): 34px 높이의 두 pill.
 * 왼쪽은 게시판(브랜드 레드), 오른쪽은 말머리(검정), 사이 간격 10px.
 */
const PostOptionBar: React.FC<PostOptionBarProps> = ({
    boards,
    boardId,
    topicId,
    onChangeBoard,
    onChangeCategory,
    disabled = false,
    isEditMode = false,
}) => {
    const currentBoard = boards.find((b) => b.id === boardId) ?? null;
    const locked = isEditMode || disabled;

    return (
        <div className="flex h-[34px] items-center gap-[10px] px-[15px]">
            <div className="relative min-w-0 flex-1">
                <select
                    className={`${PILL} ${locked || !currentBoard ? 'text-[#BBBBBB]' : 'text-ara_red'}`}
                    value={currentBoard ? String(currentBoard.id) : ''}
                    onChange={(e) => onChangeBoard(Number(e.target.value))}
                    disabled={locked}
                >
                    {!currentBoard && <option value="">게시판 선택</option>}
                    {boards.map((b) => (
                        <option key={b.id} value={b.id}>
                            {b.ko_name}
                        </option>
                    ))}
                </select>
                <ChevronDownIcon
                    size={16}
                    className="pointer-events-none absolute right-[10px] top-1/2 -translate-y-1/2 text-[#BBBBBB]"
                />
            </div>

            <div className="relative min-w-0 flex-1">
                <select
                    className={`${PILL} ${locked || topicId === '' ? 'text-[#BBBBBB]' : 'text-black'}`}
                    value={topicId}
                    onChange={(e) => onChangeCategory(e.target.value)}
                    disabled={locked}
                >
                    <option value="">말머리</option>
                    {currentBoard?.topics.map((t) => (
                        <option key={t.id} value={t.id}>
                            {t.ko_name}
                        </option>
                    ))}
                </select>
                <ChevronDownIcon
                    size={16}
                    className="pointer-events-none absolute right-[10px] top-1/2 -translate-y-1/2 text-[#BBBBBB]"
                />
            </div>
        </div>
    );
};

export default PostOptionBar;
