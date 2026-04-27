'use client';

import {
    DislikeFilledIcon,
    DislikeIcon,
    LikeFilledIcon,
    LikeIcon,
} from '@/app/web_view/_components';

interface VoteRowProps {
    myVote: boolean | null;
    positive: number;
    negative: number;
    onVote: (action: 'vote_positive' | 'vote_negative' | 'vote_cancel') => void;
}

/**
 * Faithful port of `_buildVoteButtons` and `_buildVoteIcons` in
 * `post_view_page.dart`.
 *
 *   ▲ pos-count    ▽ neg-count
 *
 * Three-state coloring:
 *   - voted opposite (myVote === !isPositive): outline + #BBBBBB
 *   - voted same (myVote === isPositive): filled + highlight (red / blue)
 *   - no vote (myVote === null): outline + highlight
 *
 * Icon: 20.17×22 in Flutter; we use 22 square (mask preserves aspect via
 * `maskSize: contain`).
 */
export function VoteRow({ myVote, positive, negative, onVote }: VoteRowProps) {
    const onUp = () => onVote(myVote === true ? 'vote_cancel' : 'vote_positive');
    const onDown = () => onVote(myVote === false ? 'vote_cancel' : 'vote_negative');

    const posColor =
        myVote === false ? 'text-[#BBBBBB]' : 'text-ara_red';
    const negColor =
        myVote === true ? 'text-[#BBBBBB]' : 'text-ara_blue';

    const PosIcon = myVote === true ? LikeFilledIcon : LikeIcon;
    const NegIcon = myVote === false ? DislikeFilledIcon : DislikeIcon;

    return (
        <div className="flex items-center justify-center pt-[10px]">
            <button
                type="button"
                onClick={onUp}
                aria-pressed={myVote === true}
                className={`flex items-center bg-transparent ${posColor}`}
            >
                <PosIcon size={22} />
                <span className="ml-1 text-[20px] font-medium">{positive}</span>
            </button>
            <div className="w-5" />
            <button
                type="button"
                onClick={onDown}
                aria-pressed={myVote === false}
                className={`flex items-center bg-transparent ${negColor}`}
            >
                <NegIcon size={22} />
                <span className="ml-1 text-[20px] font-medium">{negative}</span>
            </button>
        </div>
    );
}
