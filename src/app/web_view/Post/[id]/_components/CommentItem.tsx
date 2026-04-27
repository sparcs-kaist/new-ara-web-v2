'use client';

import { useState } from 'react';
import { formatDate } from '@/app/post/util/formatDate';
import { voteComment } from '@/lib/api/post';
import { bridge } from '@/app/web_view/_bridge';
import type { Comment, CommentNested } from '@/lib/types/post';

interface CommentItemProps {
    comment: Comment | CommentNested;
    nested?: boolean;
    onReply?: (parentId: number, defaultName: number) => void;
    onChanged?: () => void;
}

const ANONYMOUS_NICK = '익명';

function nickFor(c: Comment | CommentNested): string {
    if (c.name_type === 2) return ANONYMOUS_NICK;
    return c.created_by?.profile?.nickname ?? '';
}

function avatarLetter(nick: string): string {
    return nick?.[0] ?? '?';
}

export function CommentItem({ comment, nested = false, onReply, onChanged }: CommentItemProps) {
    const [myVote, setMyVote] = useState<boolean | null>(comment.my_vote);
    const [pos, setPos] = useState<number>(comment.positive_vote_count ?? 0);
    const [neg, setNeg] = useState<number>(comment.negative_vote_count ?? 0);

    const tap = () => {
        try {
            bridge?.send('haptic', { kind: 'light' });
        } catch {
            /* noop */
        }
    };

    const handleVote = async (positive: boolean) => {
        tap();
        const action: 'vote_positive' | 'vote_negative' | 'vote_cancel' =
            positive ? (myVote === true ? 'vote_cancel' : 'vote_positive')
                     : (myVote === false ? 'vote_cancel' : 'vote_negative');
        const prev = { myVote, pos, neg };
        // Optimistic update
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
            console.error('voteComment failed', e);
            setMyVote(prev.myVote);
            setPos(prev.pos);
            setNeg(prev.neg);
        }
    };

    const isDeleted = !!comment.deleted_at;
    const nick = nickFor(comment);
    const replies = (comment as Comment).comments;

    return (
        <div
            style={{
                padding: '12px var(--ara-spacing-lg)',
                paddingLeft: nested ? 'calc(var(--ara-spacing-lg) + 24px)' : 'var(--ara-spacing-lg)',
                borderBottom: nested ? 'none' : '1px solid var(--ara-divider)',
                background: nested ? 'var(--ara-bg-muted)' : 'var(--ara-bg)',
            }}
        >
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <div
                    aria-hidden
                    style={{
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        background: 'var(--ara-bg-muted)',
                        color: 'var(--ara-text-secondary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 12,
                        fontWeight: 600,
                        flexShrink: 0,
                    }}
                >
                    {avatarLetter(nick)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                        style={{
                            display: 'flex',
                            gap: 6,
                            alignItems: 'center',
                            fontSize: 12,
                            color: 'var(--ara-text-tertiary)',
                            marginBottom: 4,
                        }}
                    >
                        <span style={{ color: 'var(--ara-text-secondary)', fontWeight: 600 }}>{nick}</span>
                        <span aria-hidden>·</span>
                        <span>{formatDate(comment.created_at)}</span>
                    </div>
                    <p
                        style={{
                            margin: 0,
                            fontSize: 14,
                            lineHeight: 1.5,
                            color: isDeleted ? 'var(--ara-text-tertiary)' : 'var(--ara-text-primary)',
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word',
                        }}
                    >
                        {isDeleted ? '삭제된 댓글입니다.' : comment.content}
                    </p>

                    {!isDeleted && (
                        <div
                            style={{
                                display: 'flex',
                                gap: 12,
                                alignItems: 'center',
                                marginTop: 6,
                                fontSize: 12,
                                color: 'var(--ara-text-tertiary)',
                            }}
                        >
                            <button
                                type="button"
                                onClick={() => handleVote(true)}
                                style={voteBtnStyle(myVote === true, 'pos')}
                            >
                                <Arrow direction="up" /> {pos}
                            </button>
                            <button
                                type="button"
                                onClick={() => handleVote(false)}
                                style={voteBtnStyle(myVote === false, 'neg')}
                            >
                                <Arrow direction="down" /> {neg}
                            </button>
                            {!nested && onReply && (
                                <button
                                    type="button"
                                    onClick={() => onReply(comment.id, comment.name_type)}
                                    style={{
                                        background: 'transparent',
                                        border: 0,
                                        color: 'var(--ara-text-secondary)',
                                        fontSize: 12,
                                        cursor: 'pointer',
                                        padding: 0,
                                    }}
                                >
                                    답글
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {replies && replies.length > 0 && (
                <div style={{ marginTop: 8 }}>
                    {replies.map((r) => (
                        <CommentItem key={r.id} comment={r} nested onChanged={onChanged} />
                    ))}
                </div>
            )}
        </div>
    );
}

function voteBtnStyle(active: boolean, kind: 'pos' | 'neg'): React.CSSProperties {
    const color = active ? (kind === 'pos' ? 'var(--ara-positive)' : 'var(--ara-negative)') : 'var(--ara-text-tertiary)';
    return {
        background: 'transparent',
        border: 0,
        color,
        fontSize: 12,
        cursor: 'pointer',
        padding: 0,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
    };
}

function Arrow({ direction }: { direction: 'up' | 'down' }) {
    const rotate = direction === 'up' ? 0 : 180;
    return (
        <svg width="10" height="10" viewBox="0 0 14 14" fill="none" style={{ transform: `rotate(${rotate}deg)` }} aria-hidden>
            <path d="M7 3L11.5 9.5H2.5L7 3Z" fill="currentColor" />
        </svg>
    );
}
