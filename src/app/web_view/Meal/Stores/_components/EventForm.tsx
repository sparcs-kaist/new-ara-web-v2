'use client';

import { ChoiceChip } from '@/app/web_view/_components';
import { INPUT_CLASS } from '@/app/web_view/Delivery/_components/fields';
import { EVENT_KIND_LABELS, eventPeriod, kstDate, kstEndIso, kstStartIso, todayKst } from '@/lib/store';
import type { StoreEvent, StoreEventFields } from '@/lib/types/store';
import { TIME_CLASS } from './HoursFields';

type Kind = StoreEvent['kind'];
const KINDS: Kind[] = ['CLOSED', 'OPEN'];

export interface EventDraft {
    kind: Kind;
    start: string;
    end: string;
    openEnded: boolean;
    reason: string;
    open: string;
    close: string;
}

export const toEventDraft = (e: StoreEvent | null): EventDraft => ({
    kind: e?.kind ?? 'CLOSED',
    start: e ? kstDate(e.starts_at) : todayKst(),
    end: e?.ends_at ? kstDate(e.ends_at) : '',
    openEnded: !!e && e.ends_at === null,
    reason: e?.reason ?? '',
    open: e?.open ?? '',
    close: e?.close ?? '',
});

export function eventDraftError(d: EventDraft): string | null {
    if (!d.start) return '시작일을 골라 주세요';
    if (!d.openEnded && d.end && d.end < d.start) return '종료일은 시작일보다 빠를 수 없어요';
    if (d.kind === 'OPEN') {
        if (!d.open || !d.close) return '영업 시간을 입력해 주세요';
        if (d.open >= d.close) return '종료 시간은 시작 시간보다 늦어야 해요';
    }
    return null;
}

export const eventBody = (d: EventDraft): StoreEventFields => ({
    kind: d.kind,
    starts_at: kstStartIso(d.start),
    ends_at: d.openEnded || !d.end ? null : kstEndIso(d.end),
    reason: d.reason.trim(),
    open: d.kind === 'OPEN' ? d.open : null,
    close: d.kind === 'OPEN' ? d.close : null,
});

const HELPER: Record<Kind, string> = {
    CLOSED: "사유는 목록·메뉴판에 그대로 보여요. '임시 영업'을 고르면 영업 시간도 함께 입력해요.",
    OPEN: '이 기간에는 위 시간으로 영업해요. 정규 영업시간은 그대로 남아요.',
};

export function EventKindPill({ kind }: { kind: Kind }) {
    return (
        <span
            className={`inline-flex shrink-0 items-center rounded-[5px] px-[6px] py-[2px] text-[11px] font-bold leading-[13px] ${kind === 'OPEN' ? 'bg-[#F0F0F0] text-[#646464]' : 'bg-[#FFF0F0] text-ara_red'}`}
        >
            {EVENT_KIND_LABELS[kind]}
        </span>
    );
}

export interface EventAction {
    label: string;
    red?: boolean;
    onClick: () => void;
}

export function EventCard({ event, now, actions }: { event: StoreEvent; now: number; actions: EventAction[] }) {
    return (
        <div className="rounded-[12px] border border-[#F0F0F0] p-4">
            <div className="flex items-start justify-between">
                <EventKindPill kind={event.kind} />
                <span className="-mr-1 -mt-1 flex gap-3">
                    {actions.map((a) => (
                        <button key={a.label} type="button" onClick={a.onClick} className={`px-1 text-[14px] font-medium ${a.red ? 'text-ara_red' : 'text-[#646464]'}`}>
                            {a.label}
                        </button>
                    ))}
                </span>
            </div>
            <p className="mt-2 break-keep text-[16px] font-bold text-[#222222]">{event.reason || '사유 없음'}</p>
            <p className="mt-1 text-[14px] text-[#646464]">{eventPeriod(event, now)}</p>
        </div>
    );
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div>
            <p className="mb-2 text-[13px] font-semibold text-[#222222]">{label}</p>
            {children}
        </div>
    );
}

export function EventFields({
    draft,
    onChange,
    disabled = false,
    creating = false,
}: {
    draft: EventDraft;
    onChange: (draft: EventDraft) => void;
    disabled?: boolean;
    creating?: boolean;
}) {
    const set = (patch: Partial<EventDraft>) => onChange({ ...draft, ...patch });
    return (
        <div className="space-y-5">
            <Group label="종류">
                <div className="flex gap-2">
                    {KINDS.map((k) => (
                        <ChoiceChip key={k} selected={draft.kind === k} onClick={() => !disabled && set({ kind: k })}>
                            {EVENT_KIND_LABELS[k]}
                        </ChoiceChip>
                    ))}
                </div>
            </Group>
            <Group label="기간">
                <div className="flex items-center gap-3">
                    <input
                        type="date"
                        value={draft.start}
                        min={creating ? todayKst() : undefined}
                        disabled={disabled}
                        aria-label="시작일"
                        onChange={(e) => set({ start: e.target.value })}
                        className={`${INPUT_CLASS} min-w-0 flex-1`}
                    />
                    <input
                        type="date"
                        value={draft.end}
                        min={draft.start}
                        disabled={disabled || draft.openEnded}
                        aria-label="종료일"
                        onChange={(e) => set({ end: e.target.value })}
                        className={`${INPUT_CLASS} min-w-0 flex-1 disabled:text-[#BBBBBB]`}
                    />
                </div>
                <label className="mt-3 flex items-center gap-2 text-[14px] text-[#222222]">
                    <input
                        type="checkbox"
                        checked={draft.openEnded}
                        disabled={disabled}
                        onChange={(e) => set({ openEnded: e.target.checked, end: e.target.checked ? '' : draft.end })}
                        className="h-4 w-4 accent-ara_red"
                    />
                    종료일 없음 ({draft.kind === 'OPEN' ? '다시 닫을 때까지' : '다시 열 때까지'})
                </label>
            </Group>
            <Group label="사유">
                <input
                    value={draft.reason}
                    maxLength={60}
                    disabled={disabled}
                    aria-label="사유"
                    placeholder="예) 내부 공사"
                    onChange={(e) => set({ reason: e.target.value })}
                    className={INPUT_CLASS}
                />
            </Group>
            {draft.kind === 'OPEN' && (
                <Group label="영업 시간">
                    <div className="flex items-center gap-2">
                        <input type="time" value={draft.open} disabled={disabled} aria-label="영업 시작" onChange={(e) => set({ open: e.target.value })} className={TIME_CLASS} />
                        <span className="text-[13px] text-[#8A8A8A]">–</span>
                        <input type="time" value={draft.close} disabled={disabled} aria-label="영업 종료" onChange={(e) => set({ close: e.target.value })} className={TIME_CLASS} />
                    </div>
                </Group>
            )}
            <p className="whitespace-pre-line text-[12px] leading-[18px] text-[#8A8A8A]">{HELPER[draft.kind]}</p>
        </div>
    );
}
