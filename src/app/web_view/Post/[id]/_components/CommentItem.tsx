'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { voteComment } from '@/lib/api/post';
import {
    DislikeIcon,
    LikeIcon,
    MoreIcon,
    ReplyArrowIcon,
} from '@/app/web_view/_components';
import type { Comment, CommentNested } from '@/lib/types/post';

interface CommentItemProps {
    comment: Comment | CommentNested;
    nested?: boolean;
    /** Whether the comment author is the post author (for red highlight). */
    isAuthor?: boolean;
    onReply?: (parentId: number, defaultName: number) => void;
    onChanged?: () => void;
}

const ANONYMOUS_NICK = '익명';

function nickFor(c: Comment | CommentNested): string {
    if (c.name_type === 2) return ANONYMOUS_NICK;
    return c.created_by?.profile?.nickname ?? '';
}

/**
 * Faithful port of `_buildCommentListView` in `post_view_page.dart`.
 *
 * Replies sit 30px deeper than the parent (matching the Flutter
 * `margin: EdgeInsets.only(left: 30)`); the post-author's own comments
 * have a brand-red nickname.
 */
export function CommentItem({
    comment,
    nested = false,
    isAuthor = false,
    onReply,
    onChanged,
}: CommentItemProps) {
    const router = useRouter();
    const [myVote, setMyVote] = useState<boolean | null>(comment.my_vote);
    const [pos, setPos] = useState<number>(comment.positive_vote_count ?? 0);
    const [neg, setNeg] = useState<number>(comment.negative_vote_count ?? 0);

    const handleVote = async (positive: boolean) => {
        const action: 'vote_positive' | 'vote_negative' | 'vote_cancel' = positive
            ? myVote === true
                ? 'vote_cancel'
                : 'vote_positive'
            : myVote === false
              ? 'vote_cancel'
              : 'vote_negative';
        const prev = { myVote, pos, neg };
        let nMy: boolean | null = myVote;
        let nPos = pos;
        let nNeg = neg;
        if (action === 'vote_positive') {
            nMy = true;
            nPos += 1;
            if (myVote === false) nNeg -= 1;
        } else if (action === 'vote_negative') {
            nMy = false;
            nNeg += 1;
            if (myVote === true) nPos -= 1;
        } else {
            if (myVote === true) nPos -= 1;
            if (myVote === false) nNeg -= 1;
            nMy = null;
        }
        setMyVote(nMy);
        setPos(nPos);
        setNeg(nNeg);
        try {
            await voteComment(comment.id, action);
            onChanged?.();
        } catch (e) {
            console.warn('voteComment failed', e);
            setMyVote(prev.myVote);
            setPos(prev.pos);
            setNeg(prev.neg);
        }
    };

    const isDeleted = !!comment.deleted_at;
    const isHidden = comment.is_hidden ?? false;
    const isAnonymousProfile = comment.name_type !== 1;
    const nick = nickFor(comment);
    const replies = (comment as Comment).comments;

    const onAuthorTap = () => {
        if (isAnonymousProfile) return;
        router.push(`/web_view/User/${comment.created_by.id}`);
    };

    return (
        <>
            <div className={`px-5 py-[11px] ${nested ? 'pl-[50px]' : ''}`}>
                <div className="flex items-start justify-between">
                    <button
                        type="button"
                        onClick={onAuthorTap}
                        disabled={isAnonymousProfile}
                        className="flex min-w-0 items-center bg-transparent text-left disabled:cursor-default"
                    >
                        <span
                            className="inline-flex h-[25px] w-[25px] shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#E5E5E5]"
                            aria-hidden
                        >
                            {comment.created_by?.profile?.picture && (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={comment.created_by.profile.picture}
                                    alt=""
                                    className="h-full w-full object-cover"
                                />
                            )}
                        </span>
                        <span
                            className={[
                                'ml-[5px] truncate text-[14px] font-medium',
                                isAuthor ? 'text-ara_red' : 'text-[#333333]',
                            ].join(' ')}
                        >
                            {nick}
                        </span>
                        <span className="ml-[7px] text-[12px] font-normal text-[#B1B1B1]">
                            {formatTime(comment.created_at)}
                        </span>
                    </button>

                    {!isHidden && (
                        <button
                            type="button"
                            aria-label="more"
                            className="flex h-[25px] w-[50px] items-center justify-end bg-transparent text-[#9E9E9E]"
                        >
                            <MoreIcon size={18} />
                        </button>
                    )}
                </div>

                <div className="mt-[2px] pl-[30px]">
                    {isDeleted ? (
                        <p className="m-0 text-[14px] font-normal text-[#9E9E9E]">
                            삭제된 댓글입니다.
                        </p>
                    ) : isHidden ? (
                        <p className="m-0 text-[14px] font-normal text-[#9E9E9E]">
                            숨겨진 댓글입니다.
                        </p>
                    ) : (
                        <p className="m-0 whitespace-pre-wrap break-words text-[14px] font-normal text-[#4A4A4A]">
                            {comment.content}
                        </p>
                    )}
                </div>

                {!isHidden && !isDeleted && (
                    <div className="mt-2 flex items-center pl-[30px]">
                        <button
                            type="button"
                            onClick={() => handleVote(true)}
                            className={`flex items-center bg-transparent ${
                                myVote === false ? 'text-[#BBBBBB]' : 'text-ara_red'
                            }`}
                        >
                            <LikeIcon size={16} />
                            <span className="ml-[2px] text-[13px] font-medium">{pos}</span>
                        </button>
                        <div className="w-3" />
                        <button
                            type="button"
                            onClick={() => handleVote(false)}
                            className={`flex items-center bg-transparent ${
                                myVote === true ? 'text-[#BBBBBB]' : 'text-ara_blue'
                            }`}
                        >
                            <DislikeIcon size={16} />
                            <span className="ml-[2px] text-[13px] font-medium">{neg}</span>
                        </button>
                        {!nested && onReply && (
                            <>
                                <div className="w-3" />
                                <button
                                    type="button"
                                    onClick={() => onReply(comment.id, comment.name_type)}
                                    className="flex items-center bg-transparent text-black"
                                >
                                    <ReplyArrowIcon size={11} />
                                    <span className="ml-1 text-[13px] font-medium">답글</span>
                                </button>
                            </>
                        )}
                    </div>
                )}
            </div>
            <div className="mx-5 h-px bg-[#F0F0F0]" />

            {replies && replies.length > 0 && (
                <>
                    {replies.map((r) => (
                        <CommentItem
                            key={r.id}
                            comment={r}
                            nested
                            isAuthor={isAuthor}
                            onChanged={onChanged}
                        />
                    ))}
                </>
            )}
        </>
    );
}

function formatTime(iso?: string | null): string {
    if (!iso) return '';
    const t = new Date(iso).getTime();
    if (isNaN(t)) return '';
    const diffSec = Math.max(0, Math.floor((Date.now() - t) / 1000));
    if (diffSec < 60) return '방금';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}분 전`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}시간 전`;
    if (diffSec < 86400 * 7) return `${Math.floor(diffSec / 86400)}일 전`;
    const d = new Date(iso);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}
