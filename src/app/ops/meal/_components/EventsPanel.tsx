'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ConfirmDialog } from '@/app/web_view/_components/ConfirmDialog';
import { EventCard, EventFields, eventBody, eventDraftError, toEventDraft, type EventDraft } from '@/app/web_view/Meal/Stores/_components/EventForm';
import { apiDetail, createStoreEvent, deleteStoreEvent, updateStoreEvent } from '@/lib/api/store';
import { EVENT_KIND_LABELS, isEventActive, isEventFuture } from '@/lib/store';
import type { StoreEvent } from '@/lib/types/store';
import { Button, StatusLine, type Status } from './ui';
import { OPS_STORES_KEY, opsStoreEventsKey } from './keys';

export default function EventsPanel({ storeId, events }: { storeId: number; events: StoreEvent[] }) {
    const qc = useQueryClient();
    // undefined = form closed, null = adding, event = editing
    const [editing, setEditing] = useState<StoreEvent | null | undefined>(undefined);
    const [draft, setDraft] = useState<EventDraft>(() => toEventDraft(null));
    const [status, setStatus] = useState<Status>(null);
    const [busy, setBusy] = useState(false);
    const [confirm, setConfirm] = useState<StoreEvent | null>(null);
    const now = Date.now();
    const active = events.filter((e) => isEventActive(e, now));
    const future = events.filter((e) => isEventFuture(e, now)).sort((a, b) => a.starts_at.localeCompare(b.starts_at));
    const clientError = eventDraftError(draft);

    const run = async (work: () => Promise<unknown>, okText: string) => {
        if (busy) return;
        setBusy(true);
        setStatus(null);
        try {
            await work();
            // The stores list carries is_open / open_note / today_hours, which an event changes.
            await Promise.all([qc.invalidateQueries({ queryKey: opsStoreEventsKey(storeId) }), qc.invalidateQueries({ queryKey: OPS_STORES_KEY })]);
            setStatus({ ok: true, text: okText });
            setEditing(undefined);
        } catch (e) {
            setStatus({ ok: false, text: apiDetail(e) });
        } finally {
            setBusy(false);
        }
    };

    const openForm = (event: StoreEvent | null) => {
        setEditing(event);
        setDraft(toEventDraft(event));
        setStatus(null);
    };
    const submit = () => {
        if (clientError) return;
        const body = eventBody(draft);
        run(() => (editing ? updateStoreEvent(storeId, editing.id, body) : createStoreEvent(storeId, body)), editing ? '수정했어요.' : '추가했어요.');
    };
    const remove = (event: StoreEvent) => {
        setConfirm(null);
        run(() => deleteStoreEvent(storeId, event.id), '삭제했어요.');
    };

    return (
        <div className="ml-[148px] w-[600px] rounded-[8px] border border-[#E5E5E5] p-4">
            {active.length > 0 && (
                <>
                    <p className="mb-2 text-[12px] text-[#8A8A8A]">진행 중</p>
                    <div className="mb-4 grid grid-cols-2 gap-3">
                        {active.map((e) => (
                            <EventCard key={e.id} event={e} now={now} actions={[{ label: '해제', red: true, onClick: () => setConfirm(e) }]} />
                        ))}
                    </div>
                </>
            )}
            {future.length > 0 && (
                <>
                    <p className="mb-2 text-[12px] text-[#8A8A8A]">예정</p>
                    <div className="mb-4 grid grid-cols-2 gap-3">
                        {future.map((e) => (
                            <EventCard
                                key={e.id}
                                event={e}
                                now={now}
                                actions={[
                                    { label: '수정', onClick: () => openForm(e) },
                                    { label: '삭제', red: true, onClick: () => setConfirm(e) },
                                ]}
                            />
                        ))}
                    </div>
                </>
            )}
            {events.length === 0 && <p className="mb-4 text-[13px] text-[#8A8A8A]">예정된 휴무나 임시 영업이 없어요.</p>}
            {editing === undefined ? (
                <div className="flex items-center gap-4">
                    <Button onClick={() => openForm(null)} disabled={busy}>+ 휴무 · 임시 영업 추가</Button>
                    <StatusLine status={status} />
                </div>
            ) : (
                <div className="w-[420px] border-t border-[#F0F0F0] pt-4">
                    <h4 className="mb-3 text-[14px] font-semibold">{editing ? '휴무 · 임시 영업 수정' : '휴무 · 임시 영업 추가'}</h4>
                    <EventFields draft={draft} onChange={setDraft} disabled={busy} creating={editing === null} />
                    {clientError && <p className="mt-2 text-[12px] text-[#ED3A3A]">{clientError}</p>}
                    <div className="mt-4 flex items-center justify-end gap-3">
                        <StatusLine status={status} />
                        <Button onClick={() => setEditing(undefined)} disabled={busy}>취소</Button>
                        <Button variant="primary" onClick={submit} disabled={busy || !!clientError}>{editing ? '저장' : '추가'}</Button>
                    </div>
                </div>
            )}
            {confirm && (
                <ConfirmDialog
                    title={`${EVENT_KIND_LABELS[confirm.kind]}을 ${isEventActive(confirm, now) ? '해제' : '삭제'}할까요?`}
                    secondary={{ label: '취소', onClick: () => setConfirm(null) }}
                    primary={{ label: isEventActive(confirm, now) ? '해제' : '삭제', onClick: () => remove(confirm), disabled: busy }}
                    onClose={() => setConfirm(null)}
                />
            )}
        </div>
    );
}
