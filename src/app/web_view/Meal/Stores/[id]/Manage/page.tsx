'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ConfirmDialog } from '@/app/web_view/_components';
import { useInvalidateStores } from '@/app/web_view/_query';
import { CtaButton, FixedBottomBar } from '@/app/web_view/Delivery/_components/BottomCta';
import { INPUT_CLASS } from '@/app/web_view/Delivery/_components/fields';
import { apiDetail, createStoreEvent, deleteStoreEvent, updateStore, updateStoreCover } from '@/lib/api/store';
import { eventsSummary, hoursSummary, menusSummary, openEndedClosure } from '@/lib/store';
import type { StaffStoreFields, StoreDetail } from '@/lib/types/store';
import { ManageScreen, manageUrl, storeUrl } from '../../_components/ManageScreen';
import { StoreCover } from '../../_components/StoreCover';
import { ChevronRow, CounterTextarea, Field, FieldLabel, ToggleRow, ZoneSelect, usePickedFile } from '../../_components/formParts';

const TEXT_KEYS = ['name', 'intro', 'zone', 'location', 'phone', 'link'] as const;
type TextKey = (typeof TEXT_KEYS)[number];
type Draft = Pick<StaffStoreFields, TextKey>;

const toDraft = (s: StoreDetail): Draft => ({ name: s.name, intro: s.intro, zone: s.zone, location: s.location, phone: s.phone, link: s.link });

function ManageForm({ store }: { store: StoreDetail }) {
    const router = useRouter();
    const invalidate = useInvalidateStores();
    const [initial] = useState(() => toDraft(store));
    const [form, setForm] = useState(initial);
    const cover = usePickedFile();
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);
    const [confirmClose, setConfirmClose] = useState(false);
    const [toggling, setToggling] = useState(false);
    const now = Date.now();
    const closure = openEndedClosure(store.events, now);
    const base = manageUrl(store.id);

    const set = <K extends TextKey>(key: K, value: Draft[K]) => setForm((f) => ({ ...f, [key]: value }));

    const save = async () => {
        if (busy || !form.name.trim()) return;
        setBusy(true);
        setError(null);
        try {
            const changed = TEXT_KEYS.filter((k) => form[k] !== initial[k]);
            if (changed.length) await updateStore(store.id, Object.fromEntries(changed.map((k) => [k, form[k].trim()])) as Partial<Draft>);
            if (cover.picked) await updateStoreCover(store.id, cover.picked.file);
            await invalidate();
            router.replace(storeUrl(store.id));
        } catch (e) {
            setError(apiDetail(e));
            setBusy(false);
        }
    };

    const closeNow = async () => {
        if (toggling) return;
        setToggling(true);
        setError(null);
        try {
            await createStoreEvent(store.id, { kind: 'CLOSED', starts_at: new Date().toISOString(), ends_at: null, reason: '' });
            await invalidate();
        } catch (e) {
            setError(apiDetail(e));
        } finally {
            setConfirmClose(false);
            setToggling(false);
        }
    };

    const reopen = async () => {
        if (!closure || toggling) return;
        setToggling(true);
        setError(null);
        try {
            await deleteStoreEvent(store.id, closure.id);
            await invalidate();
        } catch (e) {
            setError(apiDetail(e));
        } finally {
            setToggling(false);
        }
    };

    return (
        <>
            <div className="space-y-5 px-5 pb-[96px] pt-2">
                <div>
                    <FieldLabel>대표 사진</FieldLabel>
                    <div className="relative">
                        <StoreCover src={cover.picked?.url ?? store.cover} alt={store.name} sizes="100vw" iconSize={32} priority className="h-[200px] w-full rounded-[12px]" />
                        <button type="button" onClick={cover.open} className="absolute bottom-3 right-3 h-8 rounded-full bg-black/55 px-3 text-[12px] font-medium text-white">
                            사진 변경
                        </button>
                        <input {...cover.inputProps} />
                    </div>
                </div>
                <Field label="이름">
                    <input name="name" value={form.name} maxLength={50} onChange={(e) => set('name', e.target.value)} className={INPUT_CLASS} />
                </Field>
                <Field label="소개">
                    <CounterTextarea name="intro" value={form.intro} maxLength={60} rows={2} placeholder="한 줄로 소개해 주세요" onChange={(e) => set('intro', e.target.value)} />
                </Field>
                <Field label="위치">
                    <input name="location" value={form.location} maxLength={100} placeholder="예) 태울관 (E11) 1층" onChange={(e) => set('location', e.target.value)} className={INPUT_CLASS} />
                </Field>
                <Field label="구역">
                    <ZoneSelect value={form.zone} onChange={(z) => set('zone', z)} />
                </Field>
                <Field label="전화">
                    <input name="phone" value={form.phone} inputMode="tel" maxLength={20} placeholder="042-000-0000" onChange={(e) => set('phone', e.target.value)} className={INPUT_CLASS} />
                </Field>
                <Field label="링크">
                    <input
                        name="link"
                        value={form.link}
                        inputMode="url"
                        autoCapitalize="none"
                        placeholder="https://"
                        onChange={(e) => set('link', e.target.value)}
                        className={INPUT_CLASS}
                    />
                </Field>

                <div>
                    <div className="h-px bg-[#F0F0F0]" />
                    <ChevronRow label="영업시간" value={hoursSummary(store.hours)} onClick={() => router.push(`${base}/Hours`)} />
                    <div className="h-px bg-[#F0F0F0]" />
                    <ChevronRow label="휴무 · 임시 영업" value={eventsSummary(store.events, now)} onClick={() => router.push(`${base}/Events`)} />
                    <div className="h-px bg-[#F0F0F0]" />
                    <ChevronRow label="메뉴 관리" value={menusSummary(store.menus)} onClick={() => router.push(`${base}/Menus`)} />
                    <div className="h-px bg-[#F0F0F0]" />
                    <ToggleRow
                        label="지금 영업 종료"
                        helper="켜면 다시 열 때까지 '임시 휴무'로 표시돼요"
                        checked={!!closure}
                        disabled={toggling}
                        onChange={(on) => (on ? setConfirmClose(true) : reopen())}
                    />
                </div>
                {error && <p className="text-[13px] text-ara_red">{error}</p>}
            </div>

            <FixedBottomBar>
                <CtaButton disabled={busy || !form.name.trim()} onClick={save}>
                    저장하기
                </CtaButton>
            </FixedBottomBar>

            {confirmClose && (
                <ConfirmDialog
                    title="지금 영업을 종료할까요?"
                    secondary={{ label: '취소', onClick: () => setConfirmClose(false) }}
                    primary={{ label: '영업 종료', onClick: closeNow, disabled: toggling }}
                    onClose={() => setConfirmClose(false)}
                >
                    <p className="mt-2 text-[14px] text-[#646464]">다시 켤 때까지 임시 휴무로 표시돼요</p>
                </ConfirmDialog>
            )}
        </>
    );
}

export default function ManagePage() {
    const id = Number(useParams<{ id: string }>().id);
    return (
        <ManageScreen id={id} title="내 식당 관리">
            {(store) => <ManageForm key={store.id} store={store} />}
        </ManageScreen>
    );
}
