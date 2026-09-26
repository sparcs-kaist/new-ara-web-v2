'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiDetail, opsFetchRestaurants, opsUpdateRestaurant } from '@/lib/api/store';
import type { OpsRestaurant } from '@/lib/types/store';
import { Button, inputCls, SectionTitle, StatusLine, tdCls, thCls, type Status } from './ui';
import { OPS_RESTAURANTS_KEY } from './keys';

function Toggle({ on, onChange, label }: { on: boolean; onChange: (on: boolean) => void; label: string }) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={on}
            aria-label={label}
            onClick={() => onChange(!on)}
            className={`relative h-6 w-10 rounded-full transition-colors ${on ? 'bg-[#ED3A3A]' : 'bg-[#DDDDDD]'}`}
        >
            <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${on ? 'left-[18px]' : 'left-0.5'}`} />
        </button>
    );
}

function Row({ restaurant }: { restaurant: OpsRestaurant }) {
    const qc = useQueryClient();
    const [draft, setDraft] = useState({ display_name: restaurant.display_name, code: restaurant.code ?? '', is_active: restaurant.is_active });
    const [status, setStatus] = useState<Status>(null);
    const [busy, setBusy] = useState(false);

    const save = async () => {
        if (busy) return;
        setBusy(true);
        setStatus(null);
        try {
            await opsUpdateRestaurant(restaurant.id, { display_name: draft.display_name.trim(), code: draft.code.trim() || null, is_active: draft.is_active });
            setStatus({ ok: true, text: '저장했어요.' });
            qc.invalidateQueries({ queryKey: OPS_RESTAURANTS_KEY });
        } catch (e) {
            setStatus({ ok: false, text: apiDetail(e) });
        } finally {
            setBusy(false);
        }
    };

    return (
        <tr className={draft.is_active ? '' : 'text-[#8A8A8A]'}>
            <td className={`${tdCls} font-medium`}>{restaurant.restaurant_name}</td>
            <td className={tdCls}>
                <input name={`display_name-${restaurant.id}`} className={`${inputCls} w-full`} value={draft.display_name} onChange={(e) => setDraft((d) => ({ ...d, display_name: e.target.value }))} />
            </td>
            <td className={tdCls}>
                <input name={`code-${restaurant.id}`} className={`${inputCls} w-full`} placeholder="fclt" value={draft.code} onChange={(e) => setDraft((d) => ({ ...d, code: e.target.value }))} />
            </td>
            <td className={tdCls}><Toggle on={draft.is_active} onChange={(on) => setDraft((d) => ({ ...d, is_active: on }))} label={`${restaurant.restaurant_name} 운영`} /></td>
            <td className={tdCls}>
                <div className="flex items-center gap-3">
                    <Button variant="text" onClick={save} disabled={busy}>저장</Button>
                    <StatusLine status={status} />
                </div>
            </td>
        </tr>
    );
}

export default function RestaurantsSection() {
    const restaurants = useQuery({ queryKey: OPS_RESTAURANTS_KEY, queryFn: opsFetchRestaurants });

    return (
        <section>
            <SectionTitle>학식 식당</SectionTitle>
            <p className="-mt-3 mb-4 text-[13px] text-[#666666]">크롤러가 수집한 식당 목록입니다. 표시 이름과 운영 여부만 바꿀 수 있어요.</p>
            {restaurants.isError && <StatusLine status={{ ok: false, text: apiDetail(restaurants.error) }} />}
            <table className="w-full border-collapse">
                <thead>
                    <tr>
                        <th className={thCls}>원본 이름 (크롤러)</th>
                        <th className={`${thCls} w-[300px]`}>표시 이름 (앱)</th>
                        <th className={`${thCls} w-[140px]`}>코드</th>
                        <th className={`${thCls} w-[90px]`}>운영</th>
                        <th className={`${thCls} w-[180px]`}>관리</th>
                    </tr>
                </thead>
                <tbody>
                    {restaurants.data?.map((r) => <Row key={r.id} restaurant={r} />)}
                </tbody>
            </table>
            <p className="mt-4 text-[13px] text-[#666666]">운영을 끄면 앱의 &ldquo;오늘의 학식&rdquo;에서 숨겨집니다. 수집 데이터는 그대로 남아요.</p>
        </section>
    );
}
