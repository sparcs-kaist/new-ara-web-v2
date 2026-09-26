'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useInvalidateStores } from '@/app/web_view/_query';
import { useSafeBack } from '@/app/web_view/hooks/useSafeBack';
import { CtaButton, FixedBottomBar } from '@/app/web_view/Delivery/_components/BottomCta';
import { apiDetail, updateStore } from '@/lib/api/store';
import { validateHours } from '@/lib/store';
import type { StoreDetail } from '@/lib/types/store';
import { HoursFields, toHoursDraft } from '../../../_components/HoursFields';
import { ManageScreen } from '../../../_components/ManageScreen';

function HoursEditor({ store }: { store: StoreDetail }) {
    const back = useSafeBack();
    const invalidate = useInvalidateStores();
    const [draft, setDraft] = useState(() => toHoursDraft(store.hours, store.hours_note));
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);
    const errors = validateHours(draft.week);
    const invalid = Object.keys(errors).length > 0;

    const save = async () => {
        if (busy || invalid) return;
        setBusy(true);
        setError(null);
        try {
            await updateStore(store.id, { hours: draft.week, hours_note: draft.note.trim() });
            await invalidate();
            back();
        } catch (e) {
            setError(apiDetail(e));
            setBusy(false);
        }
    };

    return (
        <>
            <div className="px-5 pb-[96px]">
                <HoursFields draft={draft} onChange={setDraft} errors={errors} disabled={busy} />
                {error && <p className="mt-3 text-[13px] text-ara_red">{error}</p>}
            </div>
            <FixedBottomBar>
                <CtaButton disabled={busy || invalid} onClick={save}>
                    저장하기
                </CtaButton>
            </FixedBottomBar>
        </>
    );
}

export default function HoursPage() {
    const id = Number(useParams<{ id: string }>().id);
    return (
        <ManageScreen id={id} backLabel="내 식당" title="영업시간">
            {(store) => <HoursEditor key={store.id} store={store} />}
        </ManageScreen>
    );
}
