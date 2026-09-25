'use client';

import { useState } from 'react';
import { castBallot } from '@/lib/api/chat';
import type { ChatVote } from '@/lib/types/chat';

function withBallot(vote: ChatVote, ids: number[]): ChatVote {
    const delta = (id: number) => Number(ids.includes(id)) - Number(vote.my_option_ids.includes(id));
    const voterDelta = Number(ids.length > 0) - Number(vote.my_option_ids.length > 0);
    return {
        ...vote,
        my_option_ids: ids,
        voter_count: vote.voter_count + voterDelta,
        options: vote.options.map((o) => ({ ...o, vote_count: o.vote_count + delta(o.id) })),
    };
}

function participantsText(vote: ChatVote): string {
    if (vote.voter_count === 0) return '아직 참여자가 없어요';
    const names = [
        ...new Set(vote.options.flatMap((o) => o.voters).map((v) => v.display_name)),
    ].slice(0, 2);
    if (names.length === 0) return `${vote.voter_count}명 참여`;
    const rest = vote.voter_count - names.length;
    return `${names.join(', ')}${rest > 0 ? ` 외 ${rest}명` : ''} 참여`;
}

export default function VoteCard({ vote, onChanged }: { vote: ChatVote; onChanged: (next: ChatVote) => void }) {
    const [pending, setPending] = useState<ChatVote | null>(null);
    const shown = pending ?? vote;

    const toggle = async (id: number) => {
        if (pending) return;
        const mine = vote.my_option_ids;
        let next: number[];
        if (mine.includes(id)) next = mine.filter((m) => m !== id);
        else if (vote.max_choices === 1) next = [id];
        else if (vote.max_choices !== null && mine.length >= vote.max_choices) return;
        else next = [...mine, id];
        setPending(withBallot(vote, next));
        try {
            onChanged(await castBallot(vote.id, next));
        } catch {
            // The server keeps the previous ballot; showing it again is the whole error state.
        } finally {
            setPending(null);
        }
    };

    return (
        <div className="w-[268px] rounded-[16px] border border-[#E4E4E4] bg-white p-4 text-left leading-[1.48] text-[#333333]">
            <p className="text-[11px] font-bold text-ara_red">
                {vote.max_choices === null ? '복수 선택' : vote.max_choices === 1 ? '1개 선택' : `최대 ${vote.max_choices}개 선택`}
            </p>
            <p className="mt-[10px] break-words text-[15px] font-bold">{vote.title}</p>
            <div className="mt-[10px] space-y-[10px]">
                {shown.options.map((o) => {
                    const selected = shown.my_option_ids.includes(o.id);
                    return (
                        <button
                            key={o.id}
                            type="button"
                            aria-pressed={selected}
                            onClick={() => toggle(o.id)}
                            className={`relative flex min-h-[38px] w-full items-center justify-between gap-2 overflow-hidden rounded-[10px] px-3 py-2 text-left text-[14px] ${selected ? 'bg-ara_red_most_bright font-bold text-ara_red' : 'bg-[#F4F4F4]'}`}
                        >
                            <span className="min-w-0 break-words">{o.text}</span>
                            <span className={`shrink-0 text-[12px] font-bold ${selected ? 'text-ara_red' : 'text-[#888888]'}`}>
                                {o.vote_count}표
                            </span>
                            <span
                                aria-hidden
                                className={`absolute bottom-0 left-0 h-[3px] ${selected ? 'bg-ara_red' : 'bg-[#D9D9D9]'}`}
                                // Share of the voters, as the render draws it: 2 of 3 voters fill two thirds.
                                style={{ width: `${shown.voter_count ? (o.vote_count / shown.voter_count) * 100 : 0}%` }}
                            />
                        </button>
                    );
                })}
            </div>
            <p className="mt-[10px] text-[12px] text-[#AAAAAA]">{participantsText(shown)}</p>
        </div>
    );
}
