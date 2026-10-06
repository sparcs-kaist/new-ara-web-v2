//PostOptionBar.tsx
'use client';

import React from 'react';
import ExpandSelect from '@/components/ExpandSelect';

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

const PILL = 'h-[34px] min-w-0 flex-1';
const PILL_BOX = 'bg-[#F8F8F8] rounded-[17px] text-[16px] font-medium leading-[18px] text-black';

/**
 * Flutter `_buildMenubar` (post_write_page.dart 785-910): 34px 높이의 두 pill.
 * 왼쪽은 게시판, 오른쪽은 말머리, 사이 간격 10px.
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
            <ExpandSelect
                options={boards.map((b) => ({ value: String(b.id), label: b.ko_name }))}
                value={boardId != null ? String(boardId) : ''}
                onChange={(v) => onChangeBoard(Number(v))}
                placeholder="게시판 선택"
                disabled={locked}
                className={PILL}
                boxClassName={PILL_BOX}
            />

            <ExpandSelect
                options={[
                    { value: '', label: '말머리 없음' },
                    ...(currentBoard?.topics.map((t) => ({ value: String(t.id), label: t.ko_name })) ?? []),
                ]}
                value={topicId}
                onChange={onChangeCategory}
                placeholder="말머리"
                disabled={locked}
                className={PILL}
                boxClassName={PILL_BOX}
            />
        </div>
    );
};

export default PostOptionBar;
