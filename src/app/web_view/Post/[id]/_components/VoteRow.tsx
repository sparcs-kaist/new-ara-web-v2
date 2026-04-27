'use client';

import { bridge } from '@/app/web_view/_bridge';

interface VoteRowProps {
    myVote: boolean | null;
    positive: number;
    negative: number;
    onVote: (action: 'vote_positive' | 'vote_negative' | 'vote_cancel') => void;
}

/**
 * Up/down arrow + count pair shown below the article body.
 */
export function VoteRow({ myVote, positive, negative, onVote }: VoteRowProps) {
    const tap = () => {
        try {
            bridge?.send('haptic', { kind: 'light' });
        } catch {
            /* noop */
        }
    };

    const handleUp = () => {
        tap();
        onVote(myVote === true ? 'vote_cancel' : 'vote_positive');
    };
    const handleDown = () => {
        tap();
        onVote(myVote === false ? 'vote_cancel' : 'vote_negative');
    };

    return (
        <div
            style={{
                display: 'flex',
                gap: 12,
                alignItems: 'center',
                justifyContent: 'center',
                padding: '12px 0',
            }}
        >
            <button
                type="button"
                onClick={handleUp}
                aria-pressed={myVote === true}
                style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 14px',
                    border: `1px solid ${myVote === true ? 'var(--ara-positive)' : 'var(--ara-divider-strong)'}`,
                    borderRadius: 999,
                    background: myVote === true ? 'var(--ara-primary-bright)' : 'transparent',
                    color: myVote === true ? 'var(--ara-positive)' : 'var(--ara-text-secondary)',
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: 'pointer',
                }}
            >
                <Arrow direction="up" />
                {positive}
            </button>
            <button
                type="button"
                onClick={handleDown}
                aria-pressed={myVote === false}
                style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 14px',
                    border: `1px solid ${myVote === false ? 'var(--ara-negative)' : 'var(--ara-divider-strong)'}`,
                    borderRadius: 999,
                    background: myVote === false ? '#EAF2FB' : 'transparent',
                    color: myVote === false ? 'var(--ara-negative)' : 'var(--ara-text-secondary)',
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: 'pointer',
                }}
            >
                <Arrow direction="down" />
                {negative}
            </button>
        </div>
    );
}

function Arrow({ direction }: { direction: 'up' | 'down' }) {
    const rotate = direction === 'up' ? 0 : 180;
    return (
        <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            style={{ transform: `rotate(${rotate}deg)` }}
            aria-hidden
        >
            <path
                d="M7 3L11.5 9.5H2.5L7 3Z"
                fill="currentColor"
            />
        </svg>
    );
}
