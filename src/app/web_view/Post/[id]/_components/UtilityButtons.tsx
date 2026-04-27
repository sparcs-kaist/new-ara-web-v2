'use client';

import {
    BarriorIcon,
    BookmarkIcon,
    DeleteIcon,
    ModifyIcon,
    ShareIcon,
    WarningIcon,
} from '@/app/web_view/_components';

interface UtilityButtonsProps {
    isMine: boolean;
    isScrapped: boolean;
    isBlockedAuthor: boolean;
    nameType: number;
    onScrap: () => void;
    onShare: () => void;
    onBlock?: () => void;
    onReport?: () => void;
    onEdit?: () => void;
    onDelete?: () => void;
}

/**
 * Mirrors `_buildUtilityButtons` in `post_view_page.dart`:
 *
 *   [ scrap ] [ share ]            [ block / delete ] [ report / edit ]
 *
 * Each pill is 35px tall with an 8px radius and a 1px hairline border.
 * The scrap pill switches to ara_red when the post is scrapped.
 */
export function UtilityButtons({
    isMine,
    isScrapped,
    isBlockedAuthor,
    nameType,
    onScrap,
    onShare,
    onBlock,
    onReport,
    onEdit,
    onDelete,
}: UtilityButtonsProps) {
    const showBlock = !isMine && nameType !== 1;

    return (
        <div className="flex items-center justify-between px-5 pt-[10px]">
            {/* Left cluster: scrap + share */}
            <div className="flex items-center gap-[10px]">
                <button
                    type="button"
                    onClick={onScrap}
                    className={[
                        'flex h-[35px] w-20 items-center justify-center rounded-lg border bg-transparent',
                        isScrapped ? 'border-ara_red text-ara_red' : 'border-[#F0F0F0] text-[#646464]',
                    ].join(' ')}
                >
                    <BookmarkIcon size={15} />
                    <span className="ml-1 text-[13px] font-medium">
                        {isScrapped ? '담아둔 글' : '담아두기'}
                    </span>
                </button>
                <button
                    type="button"
                    onClick={onShare}
                    className="flex h-[35px] w-16 items-center justify-center rounded-lg border border-[#F0F0F0] bg-transparent text-[#646464]"
                >
                    <ShareIcon size={17} />
                    <span className="ml-1 text-[13px] font-medium">공유</span>
                </button>
            </div>

            {/* Right cluster: block/delete + report/edit */}
            <div className="flex items-center gap-[10px]">
                {showBlock && (
                    <button
                        type="button"
                        onClick={onBlock}
                        className={[
                            'flex h-[35px] items-center justify-center rounded-lg border border-[#F0F0F0] bg-transparent text-[#646464]',
                            isBlockedAuthor ? 'w-[85px]' : 'w-[65px]',
                        ].join(' ')}
                    >
                        <BarriorIcon size={15} />
                        <span className="ml-[3px] text-[13px] font-medium">
                            {isBlockedAuthor ? '차단 해제' : '차단'}
                        </span>
                    </button>
                )}
                {isMine && (
                    <button
                        type="button"
                        onClick={onDelete}
                        className="flex h-[35px] w-[65px] items-center justify-center rounded-lg border border-[#F0F0F0] bg-transparent text-[#646464]"
                    >
                        <DeleteIcon size={15} />
                        <span className="ml-[2px] text-[13px] font-medium">삭제</span>
                    </button>
                )}
                {!isMine ? (
                    <button
                        type="button"
                        onClick={onReport}
                        className="flex h-[35px] w-[65px] items-center justify-center rounded-lg border border-[#F0F0F0] bg-transparent text-[#646464]"
                    >
                        <WarningIcon size={15} />
                        <span className="ml-[2px] text-[13px] font-medium">신고</span>
                    </button>
                ) : (
                    <button
                        type="button"
                        onClick={onEdit}
                        className="flex h-[35px] w-[65px] items-center justify-center rounded-lg border border-[#F0F0F0] bg-transparent text-[#646464]"
                    >
                        <ModifyIcon size={15} />
                        <span className="ml-[2px] text-[13px] font-medium">수정</span>
                    </button>
                )}
            </div>
        </div>
    );
}
