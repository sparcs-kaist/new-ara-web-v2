'use client';

import { DislikeIcon, LikeIcon } from '@/app/web_view/_components';

interface VoteRowProps {
    myVote: boolean | null;
    positive: number;
    negative: number;
    onVote: (action: 'vote_positive' | 'vote_negative' | 'vote_cancel') => void;
}

/**
 * Faithful port of `_buildVoteButtons` from `post_view_page.dart`.
 *
 * A centred row with the large like icon (≈22px) + count (20/w500) and
 * the dislike pair, separated by a 20px gap. The icon and count colours
 * follow the user's vote state exactly like Flutter's `_buildVoteIcons`.
 */
export function VoteRow({ myVote, positive, negative, onVote }: VoteRowProps) {
    const onUp = () => onVote(myVote === true ? 'vote_cancel' : 'vote_positive');
    const onDown = () => onVote(myVote === false ? 'vote_cancel' : 'vote_negative');

    // myVote === !isPositive  → grey;  myVote === null → outline;  matches → filled coloured.
    const likeColor =
        myVote === false ? 'text-[#BBBBBB]' : 'text-ara_red';
    const dislikeColor =
        myVote === true ? 'text-[#BBBBBB]' : 'text-ara_blue';

    return (
        <div className="flex items-center justify-center pt-[10px]">
            <button
                type="button"
                onClick={onUp}
                aria-pressed={myVote === true}
                className={`flex items-center bg-transparent ${likeColor}`}
            >
                <LikeIcon size={22} />
                <span className="ml-1 text-[20px] font-medium">{positive}</span>
            </button>
            <div className="w-5" />
            <button
                type="button"
                onClick={onDown}
                aria-pressed={myVote === false}
                className={`flex items-center bg-transparent ${dislikeColor}`}
            >
                <DislikeIcon size={22} />
                <span className="ml-1 text-[20px] font-medium">{negative}</span>
            </button>
        </div>
    );
}
