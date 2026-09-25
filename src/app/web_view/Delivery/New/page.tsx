'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { AppHeader, Screen } from '@/app/web_view/_components';
import { DELIVERY_KEY, useDeliveryPenalty } from '@/app/web_view/_query';
import { tick } from '@/app/web_view/hooks/haptic';
import { useNow } from '@/app/web_view/hooks/useNow';
import { apiDetail, createDeliveryParty } from '@/lib/api/delivery';
import { isPenaltyActive, pad } from '@/lib/delivery';
import { CtaButton, FixedBottomBar } from '../_components/BottomCta';
import { INPUT_CLASS, NumberInput } from '../_components/fields';

const MIN_MINUTES = 5;
const MAX_MINUTES = 60;
const QUICK_MINUTES = [10, 15, 30, 60];
const clampMinutes = (m: number) => Math.min(MAX_MINUTES, Math.max(MIN_MINUTES, m));

const INITIAL_FORM = {
    store_name: '',
    menu_name: '',
    price: '',
    place_name: '',
    place_detail: '',
    min_order_amount: '15000',
    max_participants: '',
    memo: '',
    order_link: '',
};
type FormField = keyof typeof INITIAL_FORM;
type Field = FormField | 'recruit_minutes';
const FIELDS: string[] = [...Object.keys(INITIAL_FORM), 'recruit_minutes'];

export default function DeliveryNewPage() {
    const router = useRouter();
    const qc = useQueryClient();
    const [form, setForm] = useState(INITIAL_FORM);
    const [minutesText, setMinutesText] = useState('30');
    const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
    const [formError, setFormError] = useState<string | null>(null);
    const errorRef = useRef<HTMLParagraphElement>(null);
    // 'center', not 'nearest': 'nearest' parks the line under the fixed bottom bar.
    useEffect(() => {
        if (formError) errorRef.current?.scrollIntoView({ block: 'center' });
    }, [formError]);
    const [submitting, setSubmitting] = useState(false);

    const until = useDeliveryPenalty().data?.until;
    useEffect(() => {
        if (isPenaltyActive(until)) router.replace('/web_view/Delivery/Restricted');
    }, [until, router]);

    const set = (field: FormField) => (value: string) => setForm((f) => ({ ...f, [field]: value }));

    const typedMinutes = Number(minutesText);
    const minutesOutOfRange = typedMinutes < MIN_MINUTES || typedMinutes > MAX_MINUTES;
    const minutes = clampMinutes(typedMinutes);
    const pickMinutes = (m: number) => {
        if (m !== typedMinutes) tick();
        setMinutesText(String(m));
    };

    const maxParticipants = form.max_participants ? Number(form.max_participants) : null;
    const maxTooSmall = maxParticipants !== null && maxParticipants < 2;
    const valid =
        form.store_name.trim() !== '' &&
        form.place_name.trim() !== '' &&
        Number(form.price) >= 1 &&
        form.min_order_amount !== '' &&
        !maxTooSmall;

    const submit = async () => {
        if (!valid || submitting) return;
        setSubmitting(true);
        setErrors({});
        setFormError(null);
        try {
            const party = await createDeliveryParty({
                store_name: form.store_name.trim(),
                menu_name: form.menu_name.trim(),
                price: Number(form.price),
                place_name: form.place_name.trim(),
                place_detail: form.place_detail.trim(),
                min_order_amount: Number(form.min_order_amount),
                max_participants: maxParticipants,
                recruit_minutes: minutes,
                memo: form.memo.trim(),
                order_link: form.order_link.trim(),
            });
            qc.invalidateQueries({ queryKey: DELIVERY_KEY });
            router.replace(`/web_view/Chat/${party.chat_room}`);
        } catch (e) {
            const res = (e as { response?: { status?: number; data?: unknown } }).response;
            const firstKey =
                res?.status === 400 && res.data && typeof res.data === 'object' ? Object.keys(res.data)[0] : undefined;
            if (res?.status === 403) {
                // Create answers 403 only for an active penalty; that page says why and for how long.
                qc.invalidateQueries({ queryKey: DELIVERY_KEY });
                router.replace('/web_view/Delivery/Restricted');
            } else if (firstKey && FIELDS.includes(firstKey)) setErrors({ [firstKey]: apiDetail(e) });
            else setFormError(apiDetail(e));
            setSubmitting(false);
        }
    };

    return (
        <Screen withTabBar={false}>
            <AppHeader title="방 개설하기" />

            <div className="space-y-5 px-5 pb-[96px] pt-2">
                <Section label="식당" error={errors.store_name}>
                    <input
                        value={form.store_name}
                        onChange={(e) => set('store_name')(e.target.value)}
                        placeholder="예) 배민 피자스쿨 교내점"
                        maxLength={100}
                        className={INPUT_CLASS}
                    />
                </Section>

                <Section label="내 주문" error={errors.menu_name ?? errors.price}>
                    <input
                        value={form.menu_name}
                        onChange={(e) => set('menu_name')(e.target.value)}
                        placeholder="메뉴명"
                        maxLength={100}
                        className={INPUT_CLASS}
                    />
                    <NumberInput value={form.price} onChange={set('price')} placeholder="가격" unit="원" />
                </Section>

                <Section label="배달 받을 장소" error={errors.place_name ?? errors.place_detail}>
                    <input
                        value={form.place_name}
                        onChange={(e) => set('place_name')(e.target.value)}
                        placeholder="건물 (예: 희망관 (W4))"
                        maxLength={100}
                        className={INPUT_CLASS}
                    />
                    <input
                        value={form.place_detail}
                        onChange={(e) => set('place_detail')(e.target.value)}
                        placeholder="상세 위치 (예: 1층 로비)"
                        maxLength={100}
                        className={INPUT_CLASS}
                    />
                </Section>

                <div className="flex gap-3">
                    <Section label="최소 주문 금액" error={errors.min_order_amount} className="min-w-0 flex-1">
                        <NumberInput value={form.min_order_amount} onChange={set('min_order_amount')} placeholder="0" unit="원" />
                    </Section>
                    <Section
                        label="최대 인원"
                        error={errors.max_participants ?? (maxTooSmall ? '2명 이상으로 정해 주세요' : undefined)}
                        className="min-w-0 flex-1"
                    >
                        <NumberInput value={form.max_participants} onChange={set('max_participants')} placeholder="제한 없음" unit="명" />
                    </Section>
                </div>

                <Section label="마감까지" aside={<DeadlineTime minutes={minutes} />} error={errors.recruit_minutes}>
                    <div className="flex items-center gap-2">
                        <StepButton
                            label="−"
                            ariaLabel="1분 줄이기"
                            disabled={minutes <= MIN_MINUTES}
                            onClick={() => pickMinutes(minutes - 1)}
                        />
                        <label className="flex h-12 min-w-0 flex-1 items-center justify-center rounded-[10px] bg-[#F6F6F6] px-4 text-[16px] font-semibold text-[#222222]">
                            <input
                                inputMode="numeric"
                                value={minutesText}
                                onChange={(e) => setMinutesText(e.target.value.replace(/\D/g, '').slice(0, 3))}
                                onBlur={() => {
                                    if (minutesOutOfRange) tick();
                                    setMinutesText(String(minutes));
                                }}
                                aria-label="마감까지 남은 시간(분)"
                                // Sized to the digits so "30분 후" stays one centred group, like the static text it replaces.
                                style={{ width: `${Math.max(minutesText.length, 1)}ch` }}
                                className="min-w-0 bg-transparent text-right tabular-nums focus:outline-none"
                            />
                            <span className="shrink-0">분 후</span>
                        </label>
                        <StepButton
                            label="+"
                            ariaLabel="1분 늘리기"
                            disabled={minutes >= MAX_MINUTES}
                            onClick={() => pickMinutes(minutes + 1)}
                        />
                    </div>
                    {minutesOutOfRange && <p className="text-[13px] text-ara_red">5분에서 60분 사이로 정해 주세요</p>}
                    <div className="flex gap-2">
                        {QUICK_MINUTES.map((m) => (
                            <button
                                key={m}
                                type="button"
                                aria-pressed={m === typedMinutes}
                                onClick={() => pickMinutes(m)}
                                className={`h-10 flex-1 rounded-[10px] border text-[14px] font-medium ${m === typedMinutes ? 'border-ara_red bg-white text-ara_red' : 'border-transparent bg-[#F6F6F6] text-[#646464]'}`}
                            >
                                {m}분
                            </button>
                        ))}
                    </div>
                </Section>

                <Section label="메모" error={errors.memo}>
                    <textarea
                        value={form.memo}
                        onChange={(e) => set('memo')(e.target.value)}
                        placeholder="예) 희망관 1층 로비에서 받아가요"
                        rows={3}
                        className="w-full resize-none rounded-[10px] bg-[#F6F6F6] px-4 py-3 text-[15px] text-black placeholder:text-[#BBBBBB] focus:outline-none"
                    />
                </Section>

                <Section label="함께주문 링크" error={errors.order_link}>
                    <input
                        value={form.order_link}
                        onChange={(e) => set('order_link')(e.target.value)}
                        // A pasted share text carries words around the link; keep just the first https URL.
                        onBlur={() => {
                            const url = form.order_link.match(/https:\/\/\S+/)?.[0];
                            if (url) set('order_link')(url);
                        }}
                        placeholder="배민 함께주문 링크"
                        inputMode="url"
                        autoCapitalize="none"
                        className={INPUT_CLASS}
                    />
                </Section>
                {formError && <p ref={errorRef} className="text-[13px] text-ara_red">{formError}</p>}
            </div>

            <FixedBottomBar>
                <CtaButton disabled={!valid || submitting} onClick={submit}>
                    방 만들기
                </CtaButton>
            </FixedBottomBar>
        </Screen>
    );
}

function DeadlineTime({ minutes }: { minutes: number }) {
    const now = useNow();
    // Clock text only after mount: the page is prerendered, and hydration would keep the server's time on screen.
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);
    if (!mounted) return null;
    const deadline = new Date(now + minutes * 60_000);
    return (
        <span className="text-[13px] text-[#646464]">
            마감 {pad(deadline.getHours())}:{pad(deadline.getMinutes())}
        </span>
    );
}

function Section({
    label,
    aside,
    error,
    className,
    children,
}: {
    label: string;
    aside?: ReactNode;
    error?: string;
    className?: string;
    children: ReactNode;
}) {
    return (
        <section className={className}>
            <div className="mb-2 flex items-center justify-between gap-3">
                <h2 className="text-[15px] font-semibold text-black">{label}</h2>
                {aside}
            </div>
            <div className="space-y-2">{children}</div>
            {error && <p className="mt-1 text-[13px] text-ara_red">{error}</p>}
        </section>
    );
}

function StepButton({
    label,
    ariaLabel,
    disabled,
    onClick,
}: {
    label: string;
    ariaLabel: string;
    disabled: boolean;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            aria-label={ariaLabel}
            disabled={disabled}
            onClick={onClick}
            className="flex h-12 w-12 items-center justify-center rounded-[10px] bg-[#F6F6F6] text-[20px] font-bold text-[#555555] disabled:text-[#BBBBBB]"
        >
            {label}
        </button>
    );
}
