'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { HoursFields, toHoursDraft } from '@/app/web_view/Meal/Stores/_components/HoursFields';
import { apiDetail, opsUpdateStore } from '@/lib/api/store';
import { validateHours } from '@/lib/store';
import type { OpsStore } from '@/lib/types/store';
import { Button, StatusLine, type Status } from './ui';
import { OPS_STORES_KEY } from './keys';

export default function HoursPanel({ store, onSaved, onCancel }: { store: OpsStore; onSaved: (store: OpsStore) => void; onCancel: () => void }) {
    const qc = useQueryClient();
    const [draft, setDraft] = useState(() => toHoursDraft(store.hours, store.hours_note));
    const [status, setStatus] = useState<Status>(null);
    const [busy, setBusy] = useState(false);
    const errors = validateHours(draft.week);
    const invalid = Object.keys(errors).length > 0;

    const save = async () => {
        if (busy || invalid) return;
        setBusy(true);
        setStatus(null);
        try {
            const saved = await opsUpdateStore(store.id, { hours: draft.week, hours_note: draft.note.trim() });
            qc.invalidateQueries({ queryKey: OPS_STORES_KEY });
            onSaved(saved);
        } catch (e) {
            setStatus({ ok: false, text: apiDetail(e) });
            setBusy(false);
        }
    };

    return (
        <div className="ml-[148px] w-[440px] rounded-[8px] border border-[#E5E5E5] p-4">
            <HoursFields draft={draft} onChange={setDraft} errors={errors} disabled={busy} />
            <div className="mt-4 flex items-center justify-end gap-3">
                <StatusLine status={status} />
                <Button onClick={onCancel} disabled={busy}>취소</Button>
                <Button variant="primary" onClick={save} disabled={busy || invalid}>저장</Button>
            </div>
        </div>
    );
}
