'use client';

import { useState } from 'react';
import { BottomSheet, Close2Icon, Toggle } from '@/app/web_view/_components';
import { CtaButton } from '@/app/web_view/Delivery/_components/BottomCta';
import { INPUT_CLASS } from '@/app/web_view/Delivery/_components/fields';
import { createVote } from '@/lib/api/chat';
import { apiDetail } from '@/lib/api/delivery';

const MAX_OPTIONS = 20;

/** 투표 만들기 sheet from the chat attach sheet; the server broadcasts the new VOTE message. */
export default function VoteCreateSheet({ open, roomId, onClose }: { open: boolean; roomId: number; onClose: () => void }) {
    const [prevOpen, setPrevOpen] = useState(false);
    const [title, setTitle] = useState('');
    const [options, setOptions] = useState(['', '']);
    const [multi, setMulti] = useState(false);
    const [maxChoices, setMaxChoices] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    if (open !== prevOpen) {
        setPrevOpen(open);
        if (open) {
            setTitle('');
            setOptions(['', '']);
            setMulti(false);
            setMaxChoices(null);
            setError(null);
        }
    }

    const texts = options.map((o) => o.trim());
    const duplicate = new Set(texts.filter(Boolean)).size !== texts.filter(Boolean).length;
    const valid = title.trim() !== '' && texts.every(Boolean) && !duplicate;

    const setOption = (i: number, value: string) => setOptions((prev) => prev.map((o, j) => (j === i ? value : o)));
    const removeOption = (i: number) => {
        const next = options.filter((_, j) => j !== i);
        setOptions(next);
        if (maxChoices !== null && maxChoices > next.length) setMaxChoices(next.length);
    };

    const submit = async () => {
        if (!valid || submitting) return;
        setSubmitting(true);
        setError(null);
        try {
            await createVote({ chat_room: roomId, title: title.trim(), options: texts, max_choices: multi ? maxChoices : 1 });
            onClose();
        } catch (e) {
            setError(apiDetail(e));
        } finally {
            setSubmitting(false);
        }
    };

    const chip = (value: number | null, label: string) => (
        <button
            key={label}
            type="button"
            aria-pressed={maxChoices === value}
            onClick={() => setMaxChoices(value)}
            className={`h-8 min-w-8 rounded-[8px] px-[10px] text-[14px] font-medium ${maxChoices === value ? 'bg-ara_red text-white' : 'bg-[#F6F6F6] text-[#646464]'}`}
        >
            {label}
        </button>
    );

    return (
        <BottomSheet open={open} onClose={onClose} title="투표 만들기">
            <div className="space-y-4 border-t border-[#F0F0F0] px-5 pt-4">
                <div>
                    <p className="mb-2 text-[14px] font-semibold text-black">제목</p>
                    <input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="투표 제목"
                        maxLength={100}
                        className={INPUT_CLASS}
                    />
                </div>

                <div>
                    <p className="mb-2 text-[14px] font-semibold text-black">선택지</p>
                    <div className="space-y-2">
                        {options.map((option, i) => (
                            <div key={i} className="flex h-12 items-center rounded-[10px] bg-[#F6F6F6] pl-4 pr-2">
                                <input
                                    value={option}
                                    onChange={(e) => setOption(i, e.target.value)}
                                    placeholder={`선택지 ${i + 1}`}
                                    maxLength={100}
                                    className="min-w-0 flex-1 bg-transparent text-[15px] text-black placeholder:text-[#BBBBBB] focus:outline-none"
                                />
                                {options.length > 2 && (
                                    <button
                                        type="button"
                                        aria-label="선택지 삭제"
                                        onClick={() => removeOption(i)}
                                        className="flex h-8 w-8 shrink-0 items-center justify-center text-[#646464]"
                                    >
                                        <Close2Icon size={20} />
                                    </button>
                                )}
                            </div>
                        ))}
                        {options.length < MAX_OPTIONS && (
                            <button
                                type="button"
                                onClick={() => setOptions((prev) => [...prev, ''])}
                                className="h-12 w-full rounded-[10px] border border-dashed border-[#D9D9D9] text-[14px] font-medium text-[#646464]"
                            >
                                + 선택지 추가
                            </button>
                        )}
                    </div>
                    {duplicate && <p className="mt-1 text-[13px] text-ara_red">같은 선택지가 있어요</p>}
                </div>

                <div className="space-y-3 border-t border-[#F0F0F0] pt-4">
                    <div className="flex items-center justify-between">
                        <span className="text-[15px] font-semibold text-black">중복 선택 허용</span>
                        <Toggle checked={multi} onChange={setMulti} />
                    </div>
                    {multi && (
                        <div className="flex items-center justify-between gap-3">
                            <span className="shrink-0 text-[15px] font-semibold text-black">최대 선택 개수</span>
                            <div className="flex flex-wrap justify-end gap-[6px]">
                                {Array.from({ length: Math.min(3, options.length) }, (_, i) => chip(i + 1, String(i + 1)))}
                                {chip(null, '제한 없음')}
                            </div>
                        </div>
                    )}
                </div>

                {error && <p className="text-[13px] text-ara_red">{error}</p>}
                <CtaButton disabled={!valid || submitting} onClick={submit}>
                    투표 보내기
                </CtaButton>
            </div>
        </BottomSheet>
    );
}
