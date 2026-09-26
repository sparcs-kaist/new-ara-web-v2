'use client';

import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import Image from 'next/image';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiDetail, fetchStoreEvents, opsCreateStore, opsDeleteStore, opsFetchRestaurants, opsUpdateStore, opsUpdateStoreCover } from '@/lib/api/store';
import { eventsSummary, hoursSummary } from '@/lib/store';
import { ZONE_LABELS, type OpsStore, type StoreFields, type Zone } from '@/lib/types/store';
import { ConfirmDialog } from '@/app/web_view/_components/ConfirmDialog';
import { Breadcrumb, Button, Card, Field, inputCls, StatusLine, type Status } from './ui';
import { OPS_RESTAURANTS_KEY, OPS_STORES_KEY, opsStoreEventsKey } from './keys';
import HoursPanel from './HoursPanel';
import EventsPanel from './EventsPanel';

const FIELDS = ['name', 'intro', 'zone', 'location', 'phone', 'link', 'restaurant', 'is_active', 'order'] as const;

type TextFields = Omit<StoreFields, 'hours' | 'hours_note'>;

const toFields = (s: OpsStore | null): TextFields => ({
    name: s?.name ?? '',
    intro: s?.intro ?? '',
    zone: s?.zone ?? 'EAST',
    location: s?.location ?? '',
    phone: s?.phone ?? '',
    link: s?.link ?? '',
    restaurant: s?.restaurant ?? null,
    is_active: s?.is_active ?? true,
    order: s?.order ?? 0,
});

interface Props {
    store: OpsStore | null;
    onBack: () => void;
    onSaved: (store: OpsStore) => void;
}

export default function StoreForm({ store, onBack, onSaved }: Props) {
    const qc = useQueryClient();
    const [initial, setInitial] = useState(() => toFields(store));
    const [form, setForm] = useState(initial);
    const [cover, setCover] = useState<{ file: File; url: string } | null>(null);
    const [status, setStatus] = useState<Status>(null);
    const [busy, setBusy] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);
    const [hoursOpen, setHoursOpen] = useState(false);
    const [eventsOpen, setEventsOpen] = useState(false);
    const { data: restaurants = [] } = useQuery({ queryKey: OPS_RESTAURANTS_KEY, queryFn: opsFetchRestaurants });
    const storeId = store?.id ?? 0;
    const { data: events = [] } = useQuery({ queryKey: opsStoreEventsKey(storeId), queryFn: () => fetchStoreEvents(storeId), enabled: storeId > 0 });

    useEffect(() => () => {
        if (cover) URL.revokeObjectURL(cover.url);
    }, [cover]);

    const set = <K extends keyof TextFields>(key: K, value: TextFields[K]) => setForm((f) => ({ ...f, [key]: value }));

    const onPick = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (file) setCover({ file, url: URL.createObjectURL(file) });
    };

    const save = async () => {
        if (busy) return;
        setBusy(true);
        setStatus(null);
        try {
            const changed = FIELDS.filter((k) => !store || form[k] !== initial[k]);
            let saved: OpsStore;
            if (!store) {
                const fd = new FormData();
                changed.forEach((k) => fd.append(k, form[k] === null ? '' : String(form[k])));
                if (cover) fd.append('cover', cover.file);
                saved = await opsCreateStore(fd);
            } else {
                saved = changed.length ? await opsUpdateStore(store.id, Object.fromEntries(changed.map((k) => [k, form[k]]))) : store;
                if (cover) saved = await opsUpdateStoreCover(store.id, cover.file);
            }
            setInitial(toFields(saved));
            setForm(toFields(saved));
            setCover(null);
            setStatus({ ok: true, text: '저장했어요.' });
            qc.invalidateQueries({ queryKey: OPS_STORES_KEY });
            onSaved(saved);
        } catch (e) {
            setStatus({ ok: false, text: apiDetail(e) });
        } finally {
            setBusy(false);
        }
    };

    const remove = async () => {
        if (!store || busy) return;
        setBusy(true);
        try {
            await opsDeleteStore(store.id);
            qc.invalidateQueries({ queryKey: OPS_STORES_KEY });
            onBack();
        } catch (e) {
            setConfirmDelete(false);
            setStatus({ ok: false, text: apiDetail(e) });
            setBusy(false);
        }
    };

    const coverUrl = cover?.url ?? (store?.cover || null);

    return (
        <section>
            <Breadcrumb parent="입주 업체" onParent={onBack} current={store?.name ?? '새 업체'} />
            <h2 className="mb-5 text-[22px] font-bold">{store ? '업체 편집' : '업체 추가'}</h2>
            <div className="flex items-start gap-6">
                <Card className="w-[800px] space-y-4">
                    <Field label="이름"><input name="name" className={`${inputCls} w-[380px]`} value={form.name} onChange={(e) => set('name', e.target.value)} /></Field>
                    <Field label="소개"><textarea name="intro" className={`${inputCls} h-[76px] w-[380px] py-2`} value={form.intro} onChange={(e) => set('intro', e.target.value)} /></Field>
                    <Field label="구역">
                        <select name="zone" className={`${inputCls} w-[180px]`} value={form.zone} onChange={(e) => set('zone', e.target.value as Zone)}>
                            {(Object.keys(ZONE_LABELS) as Zone[]).map((z) => <option key={z} value={z}>{ZONE_LABELS[z]}</option>)}
                        </select>
                    </Field>
                    <Field label="위치"><input name="location" className={`${inputCls} w-[380px]`} value={form.location} onChange={(e) => set('location', e.target.value)} /></Field>
                    {store && (
                        <>
                            <Field label="영업시간">
                                <div className="flex h-9 items-center gap-6 text-[14px]">
                                    <span>{hoursSummary(store.hours)}</span>
                                    <Button variant="text" onClick={() => setHoursOpen((v) => !v)}>{hoursOpen ? '닫기' : '편집'}</Button>
                                </div>
                            </Field>
                            {hoursOpen && <HoursPanel store={store} onCancel={() => setHoursOpen(false)} onSaved={(saved) => { setHoursOpen(false); onSaved(saved); }} />}
                            <Field label="휴무 · 임시 영업">
                                <div className="flex h-9 items-center gap-6 text-[14px]">
                                    <span>{eventsSummary(events, Date.now())}</span>
                                    <Button variant="text" onClick={() => setEventsOpen((v) => !v)}>{eventsOpen ? '닫기' : '편집'}</Button>
                                </div>
                            </Field>
                            {eventsOpen && <EventsPanel storeId={store.id} events={events} />}
                        </>
                    )}
                    <Field label="전화"><input name="phone" className={`${inputCls} w-[380px]`} value={form.phone} onChange={(e) => set('phone', e.target.value)} /></Field>
                    <Field label="링크"><input name="link" className={`${inputCls} w-[380px]`} value={form.link} onChange={(e) => set('link', e.target.value)} /></Field>
                    <Field label="학식 식당 연결">
                        <select name="restaurant" className={`${inputCls} w-[380px]`} value={form.restaurant ?? ''} onChange={(e) => set('restaurant', e.target.value ? Number(e.target.value) : null)}>
                            <option value="">연결 안 함</option>
                            {restaurants.map((r) => <option key={r.id} value={r.id}>{r.display_name || r.restaurant_name}</option>)}
                        </select>
                    </Field>
                    <Field label="대표 사진">
                        <div className="flex items-center gap-4">
                            <div className="relative h-20 w-[120px] overflow-hidden rounded-[6px] bg-[#EFEFEF]">
                                {coverUrl && <Image src={coverUrl} alt="대표 사진" fill sizes="120px" className="object-cover" />}
                            </div>
                            <Button onClick={() => fileRef.current?.click()}>파일 선택</Button>
                            <input ref={fileRef} name="cover" type="file" accept="image/*" className="hidden" onChange={onPick} />
                        </div>
                    </Field>
                    <Field label="운영 여부">
                        <label className="flex h-9 items-center gap-2 text-[14px]">
                            <input name="is_active" type="checkbox" className="h-4 w-4 accent-[#ED3A3A]" checked={form.is_active} onChange={(e) => set('is_active', e.target.checked)} />
                            운영 중
                        </label>
                        <p className="text-[13px] text-[#8A8A8A]">폐업 · 철수한 업체만 해제합니다. 영업 여부(영업시간 · 임시 휴무)와는 별개예요.</p>
                    </Field>
                    <Field label="순서"><input name="order" type="number" className={`${inputCls} w-[120px]`} value={form.order} onChange={(e) => set('order', Number(e.target.value))} /></Field>
                    <div className="flex items-center justify-between pt-2">
                        <div>{store && <Button onClick={() => setConfirmDelete(true)} disabled={busy}>삭제</Button>}</div>
                        <div className="flex items-center gap-3">
                            <StatusLine status={status} />
                            <Button onClick={onBack}>취소</Button>
                            <Button variant="primary" onClick={save} disabled={busy || !form.name.trim()}>저장</Button>
                        </div>
                    </div>
                </Card>
                {store && <p className="w-[200px] pt-10 text-[13px] leading-5 text-[#666666]">삭제하지 말고 운영 여부를 끄면 앱 목록에서만 숨겨집니다.</p>}
            </div>
            {confirmDelete && store && (
                <ConfirmDialog
                    title={`${store.name}을(를) 삭제할까요?`}
                    secondary={{ label: '취소', onClick: () => setConfirmDelete(false) }}
                    primary={{ label: '삭제', onClick: remove, disabled: busy }}
                    onClose={() => setConfirmDelete(false)}
                >
                    <p className="mt-2 text-[14px] text-[#666666]">메뉴와 직원 지정도 함께 사라져요. 숨기기만 하려면 운영 여부를 꺼 주세요.</p>
                </ConfirmDialog>
            )}
        </section>
    );
}
