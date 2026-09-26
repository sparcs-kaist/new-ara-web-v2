'use client';

import { Toggle } from '@/app/web_view/_components';
import { INPUT_CLASS } from '@/app/web_view/Delivery/_components/fields';
import { pad } from '@/lib/delivery';
import { normalizeHours, type WeekHours } from '@/lib/store';
import { WEEKDAYS, WEEKDAY_LABELS, type StoreHours, type StoreHoursRange, type Weekday } from '@/lib/types/store';

const MAX_RANGES = 3;
const DEFAULT_RANGE: StoreHoursRange = { open: '09:00', close: '18:00' };

// The picker icon is hidden: it would not fit next to the locale's "오전 11:00", and tapping the field opens the picker anyway.
export const TIME_CLASS =
    'h-9 w-[96px] rounded-[8px] bg-[#F6F6F6] px-1 text-center text-[14px] text-[#222222] focus:outline-none disabled:text-[#BBBBBB] [&::-webkit-calendar-picker-indicator]:hidden';

export interface HoursDraft {
    week: WeekHours;
    note: string;
    same: boolean;
}

const sameWeek = (week: WeekHours) => WEEKDAYS.every((d) => JSON.stringify(week[d]) === JSON.stringify(week.mon));

export const toHoursDraft = (hours: StoreHours | null | undefined, note: string): HoursDraft => {
    const week = normalizeHours(hours);
    return { week, note, same: week.mon.length > 0 && sameWeek(week) };
};

const plusHours = (time: string, hours: number) => {
    const [h, m] = time.split(':').map(Number);
    return h + hours >= 24 ? '23:59' : `${pad(h + hours)}:${pad(m)}`;
};

function RoundButton({ label, ariaLabel, disabled, onClick }: { label: string; ariaLabel: string; disabled: boolean; onClick: () => void }) {
    return (
        <button
            type="button"
            aria-label={ariaLabel}
            disabled={disabled}
            onClick={onClick}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#F0F0F0] text-[18px] font-bold leading-none text-[#555555] disabled:text-[#CCCCCC]"
        >
            {label}
        </button>
    );
}

export function HoursFields({
    draft,
    onChange,
    errors,
    disabled = false,
}: {
    draft: HoursDraft;
    onChange: (draft: HoursDraft) => void;
    errors: Partial<Record<Weekday, string>>;
    disabled?: boolean;
}) {
    const setDay = (day: Weekday, ranges: StoreHoursRange[]) => {
        const week = { ...draft.week };
        if (draft.same) WEEKDAYS.forEach((d) => (week[d] = ranges));
        else week[day] = ranges;
        onChange({ ...draft, week });
    };
    const setSame = (same: boolean) => {
        const week = same ? (Object.fromEntries(WEEKDAYS.map((d) => [d, draft.week.mon])) as WeekHours) : draft.week;
        onChange({ ...draft, same, week });
    };
    const reopened = () => WEEKDAYS.map((d) => draft.week[d]).find((r) => r.length > 0) ?? [DEFAULT_RANGE];

    return (
        <div>
            <div className="flex h-[52px] items-center justify-between">
                <span className="text-[16px] font-medium text-[#222222]">모든 요일 같게</span>
                <Toggle checked={draft.same} onChange={setSame} disabled={disabled} />
            </div>
            <div className="h-px bg-[#F0F0F0]" />
            {WEEKDAYS.map((day) => {
                const ranges = draft.week[day];
                const off = ranges.length === 0;
                const mirrored = draft.same && day !== 'mon';
                const dis = disabled || mirrored;
                const label = WEEKDAY_LABELS[day];
                const dayLabel = <span className={`w-7 shrink-0 text-[15px] font-bold ${off ? 'text-[#BBBBBB]' : 'text-[#222222]'}`}>{label}</span>;
                const offBox = (
                    <label className="flex h-9 shrink-0 items-center gap-1 text-[13px] text-[#222222]">
                        <input
                            type="checkbox"
                            checked={off}
                            disabled={dis}
                            aria-label={`${label} 휴무`}
                            onChange={(e) => setDay(day, e.target.checked ? [] : reopened())}
                            className="h-4 w-4 accent-ara_red"
                        />
                        휴무
                    </label>
                );
                return (
                    <div key={day} className={`space-y-2 border-b border-[#F0F0F0] py-3 ${mirrored ? 'opacity-50' : ''}`}>
                        {off ? (
                            <div className="flex items-center gap-2">
                                {dayLabel}
                                <div className="flex h-9 min-w-0 flex-1 items-center justify-center rounded-[8px] bg-[#F6F6F6] text-[13px] text-[#BBBBBB]">휴무</div>
                                {offBox}
                                <RoundButton label="+" ariaLabel={`${label} 구간 추가`} disabled onClick={() => {}} />
                            </div>
                        ) : (
                            ranges.map((r, i) => (
                                <div key={i} className="flex items-center gap-2">
                                    {i === 0 ? dayLabel : <span className="w-7 shrink-0" />}
                                    <input
                                        type="time"
                                        value={r.open}
                                        disabled={dis}
                                        aria-label={`${label} 시작 ${i + 1}`}
                                        onChange={(e) => setDay(day, ranges.map((x, j) => (j === i ? { ...x, open: e.target.value } : x)))}
                                        className={TIME_CLASS}
                                    />
                                    <span className="text-[13px] text-[#8A8A8A]">–</span>
                                    <input
                                        type="time"
                                        value={r.close}
                                        disabled={dis}
                                        aria-label={`${label} 종료 ${i + 1}`}
                                        onChange={(e) => setDay(day, ranges.map((x, j) => (j === i ? { ...x, close: e.target.value } : x)))}
                                        className={TIME_CLASS}
                                    />
                                    <span className="ml-auto flex items-center gap-2">
                                        {i === 0 ? (
                                            <>
                                                {offBox}
                                                <RoundButton
                                                    label="+"
                                                    ariaLabel={`${label} 구간 추가`}
                                                    disabled={dis || ranges.length >= MAX_RANGES}
                                                    onClick={() => {
                                                        const last = ranges[ranges.length - 1].close;
                                                        setDay(day, [...ranges, { open: last, close: plusHours(last, 3) }]);
                                                    }}
                                                />
                                            </>
                                        ) : (
                                            <RoundButton label="−" ariaLabel={`${label} 구간 ${i + 1} 빼기`} disabled={dis} onClick={() => setDay(day, ranges.filter((_, j) => j !== i))} />
                                        )}
                                    </span>
                                </div>
                            ))
                        )}
                        {errors[day] && <p className="pl-9 text-[12px] text-ara_red">{errors[day]}</p>}
                    </div>
                );
            })}
            <label className="mt-5 block">
                <span className="mb-2 block text-[12px] text-[#8A8A8A]">비고</span>
                <input
                    value={draft.note}
                    maxLength={200}
                    disabled={disabled}
                    onChange={(e) => onChange({ ...draft, note: e.target.value })}
                    placeholder="예) 라스트 오더 19:30"
                    className={INPUT_CLASS}
                />
            </label>
            <p className="mt-2 text-[12px] text-[#8A8A8A]">점심·저녁 사이 브레이크 타임은 ＋ 를 눌러 구간을 나눠 주세요.</p>
        </div>
    );
}
