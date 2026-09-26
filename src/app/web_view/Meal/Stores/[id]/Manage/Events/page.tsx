'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { BottomSheet, ConfirmDialog, Skeleton } from '@/app/web_view/_components';
import { useInvalidateStores, useStoreEvents } from '@/app/web_view/_query';
import { usePullToRefresh } from '@/app/web_view/hooks/usePullToRefresh';
import { CtaButton } from '@/app/web_view/Delivery/_components/BottomCta';
import { apiDetail, createStoreEvent, deleteStoreEvent, errorStatus, updateStoreEvent } from '@/lib/api/store';
import { EVENT_KIND_LABELS, isEventActive, isEventFuture } from '@/lib/store';
import type { StoreDetail, StoreEvent } from '@/lib/types/store';
import { EmptyState } from '../../../_components/EmptyState';
import { EventCard, EventFields, eventBody, eventDraftError, toEventDraft } from '../../../_components/EventForm';
import { ManageScreen, storeUrl } from '../../../_components/ManageScreen';
import { DashedButton } from '../../../_components/formParts';

// BottomSheet unmounts its children when closed, so each opening starts a fresh form.
function EventSheetForm({ storeId, event, onClose }: { storeId: number; event: StoreEvent | null; onClose: () => void }) {
    const invalidate = useInvalidateStores();
    const [draft, setDraft] = useState(() => toEventDraft(event));
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const clientError = eventDraftError(draft);

    const run = async (work: () => Promise<unknown>) => {
        if (busy) return;
        setBusy(true);
        setError(null);
        try {
            await work();
            await invalidate();
            onClose();
        } catch (e) {
            setConfirmDelete(false);
            setError(apiDetail(e));
            setBusy(false);
        }
    };
    const submit = () => {
        if (clientError) return;
        const body = eventBody(draft);
        run(() => (event ? updateStoreEvent(storeId, event.id, body) : createStoreEvent(storeId, body)));
    };

    return (
        <div className="px-5">
            <EventFields draft={draft} onChange={setDraft} disabled={busy} />
            {(error ?? clientError) && <p className="mt-3 text-[13px] text-ara_red">{error ?? clientError}</p>}
            <div className="mt-5">
                <CtaButton disabled={busy || !!clientError} onClick={submit}>
                    {event ? '저장하기' : '추가하기'}
                </CtaButton>
            </div>
            {event && (
                <button type="button" onClick={() => setConfirmDelete(true)} className="mt-2 h-11 w-full text-center text-[14px] font-medium text-ara_red">
                    삭제
                </button>
            )}
            {confirmDelete && event && (
                <ConfirmDialog
                    title={`${EVENT_KIND_LABELS[event.kind]}을 삭제할까요?`}
                    secondary={{ label: '취소', onClick: () => setConfirmDelete(false) }}
                    primary={{ label: '삭제', onClick: () => run(() => deleteStoreEvent(storeId, event.id)), disabled: busy }}
                    onClose={() => setConfirmDelete(false)}
                />
            )}
        </div>
    );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <section>
            <h2 className="mb-2 text-[12px] text-[#8A8A8A]">{title}</h2>
            <div className="space-y-3">{children}</div>
        </section>
    );
}

function EventsList({ store }: { store: StoreDetail }) {
    const router = useRouter();
    const invalidate = useInvalidateStores();
    const events = useStoreEvents(store.id);
    // The event stays while the sheet slides out, so its fields do not flash empty.
    const [sheet, setSheet] = useState<{ open: boolean; event: StoreEvent | null }>({ open: false, event: null });
    const [release, setRelease] = useState<StoreEvent | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);
    const now = Date.now();

    usePullToRefresh();

    useEffect(() => {
        if (errorStatus(events.error) === 403) router.replace(storeUrl(store.id));
    }, [events.error, router, store.id]);

    const list = events.data ?? [];
    const active = list.filter((e) => isEventActive(e, now));
    const future = list.filter((e) => isEventFuture(e, now)).sort((a, b) => a.starts_at.localeCompare(b.starts_at));

    const remove = async (event: StoreEvent) => {
        setRelease(null);
        if (busy) return;
        setBusy(true);
        setError(null);
        try {
            await deleteStoreEvent(store.id, event.id);
            await invalidate();
        } catch (e) {
            setError(apiDetail(e));
        } finally {
            setBusy(false);
        }
    };

    return (
        <>
            <div className="space-y-5 px-5 pb-8 pt-2">
                {events.isPending ? (
                    <Skeleton className="h-[96px] w-full rounded-[12px]" />
                ) : events.isError ? (
                    <p className="py-10 text-center text-[14px] text-[#BBBBBB]">{apiDetail(events.error)}</p>
                ) : (
                    <>
                        {active.length > 0 && (
                            <Group title="진행 중">
                                {active.map((e) => (
                                    <EventCard key={e.id} event={e} now={now} actions={[{ label: '해제', red: true, onClick: () => setRelease(e) }]} />
                                ))}
                            </Group>
                        )}
                        {future.length > 0 && (
                            <Group title="예정">
                                {future.map((e) => (
                                    <EventCard key={e.id} event={e} now={now} actions={[{ label: '수정', onClick: () => setSheet({ open: true, event: e }) }]} />
                                ))}
                            </Group>
                        )}
                        {list.length === 0 && <EmptyState title="예정된 휴무나 임시 영업이 없어요" className="py-8" />}
                    </>
                )}
                <div>
                    <DashedButton onClick={() => setSheet({ open: true, event: null })}>+ 휴무 · 임시 영업 추가</DashedButton>
                    <p className="mt-2 text-center text-[12px] text-[#8A8A8A]">종료일을 비우면 다시 열 때까지 계속 적용돼요.</p>
                </div>
                {error && <p className="text-center text-[13px] text-ara_red">{error}</p>}
            </div>

            <BottomSheet open={sheet.open} onClose={() => setSheet((s) => ({ ...s, open: false }))} title={sheet.event ? '휴무 · 임시 영업 수정' : '휴무 · 임시 영업 추가'}>
                <EventSheetForm storeId={store.id} event={sheet.event} onClose={() => setSheet((s) => ({ ...s, open: false }))} />
            </BottomSheet>

            {release && (
                <ConfirmDialog
                    title={`${EVENT_KIND_LABELS[release.kind]}을 해제할까요?`}
                    secondary={{ label: '취소', onClick: () => setRelease(null) }}
                    primary={{ label: '해제', onClick: () => remove(release), disabled: busy }}
                    onClose={() => setRelease(null)}
                >
                    <p className="mt-2 text-[14px] text-[#646464]">해제하면 바로 정규 영업시간으로 돌아가요.</p>
                </ConfirmDialog>
            )}
        </>
    );
}

export default function EventsPage() {
    const id = Number(useParams<{ id: string }>().id);
    return (
        <ManageScreen id={id} backLabel="내 식당" title="휴무 · 임시 영업">
            {(store) => <EventsList key={store.id} store={store} />}
        </ManageScreen>
    );
}
