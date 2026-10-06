'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useQueryClient } from '@tanstack/react-query';
import { deleteMealPhoto } from '@/lib/api/meal';
import { apiDetail } from '@/lib/api/delivery';
import type { Paginated } from '@/lib/types/delivery';
import { currentMealSlot, timeStringToMealType, type MealPhoto, type MealType } from '@/lib/types/meal';
import { MEAL_PHOTOS_KEY, useMealPhotos, useRestaurantName, useRestaurants } from '@/app/web_view/_query/meal';
import { ConfirmDialog } from '@/app/web_view/_components/ConfirmDialog';
import { Button, inputCls, SectionTitle, StatusLine, type Status } from './ui';

const MEAL_LABELS: Record<MealType, string> = { BREAKFAST: '아침', LUNCH: '점심', DINNER: '저녁' };

const today = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const hhmm = (iso: string) => {
    const d = new Date(iso);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

export default function PhotosSection() {
    const qc = useQueryClient();
    const restaurants = useRestaurants();
    const restaurantName = useRestaurantName();
    const [date, setDate] = useState(today);
    const [restaurantId, setRestaurantId] = useState<number | ''>('');
    const [meal, setMeal] = useState<MealType>(() => timeStringToMealType(currentMealSlot().time));
    const [deleteTarget, setDeleteTarget] = useState<MealPhoto | null>(null);
    const [status, setStatus] = useState<Status>(null);
    const [busy, setBusy] = useState(false);

    const selected = restaurantId === '' ? restaurants : restaurants.filter((r) => r.id === restaurantId);
    const queries = useMealPhotos(selected, date.replace(/-/g, ''), meal);
    const photos = queries.flatMap((q) => q.data?.results ?? []);
    const loading = queries.some((q) => q.isPending);
    const failed = queries.find((q) => q.isError);

    const remove = async () => {
        if (!deleteTarget || busy) return;
        const target = deleteTarget;
        setBusy(true);
        setStatus(null);
        try {
            await deleteMealPhoto(target.id);
            qc.setQueriesData<Paginated<MealPhoto>>({ queryKey: MEAL_PHOTOS_KEY }, (old) => old && { ...old, results: old.results.filter((p) => p.id !== target.id) });
            qc.invalidateQueries({ queryKey: MEAL_PHOTOS_KEY });
            setStatus({ ok: true, text: '사진을 삭제했어요.' });
        } catch (e) {
            setStatus({ ok: false, text: apiDetail(e) });
        } finally {
            setDeleteTarget(null);
            setBusy(false);
        }
    };

    return (
        <section>
            <SectionTitle>메뉴 사진</SectionTitle>
            <div className="mb-5 flex items-center gap-4">
                <input type="date" aria-label="날짜" className={`${inputCls} w-[160px]`} value={date} onChange={(e) => e.target.value && setDate(e.target.value)} />
                <select aria-label="식당" className={`${inputCls} w-[220px]`} value={restaurantId} onChange={(e) => setRestaurantId(e.target.value ? Number(e.target.value) : '')}>
                    <option value="">식당: 전체</option>
                    {restaurants.map((r) => <option key={r.id} value={r.id}>{restaurantName(r)}</option>)}
                </select>
                <select aria-label="끼니" className={`${inputCls} w-[120px]`} value={meal} onChange={(e) => setMeal(e.target.value as MealType)}>
                    {(Object.keys(MEAL_LABELS) as MealType[]).map((m) => <option key={m} value={m}>{MEAL_LABELS[m]}</option>)}
                </select>
                <StatusLine status={status} />
            </div>
            {failed && <StatusLine status={{ ok: false, text: apiDetail(failed.error) }} />}
            {!loading && photos.length === 0 && <p className="text-[14px] text-[#8A8A8A]">이 날짜·끼니에 올라온 사진이 없어요.</p>}
            <div className="grid grid-cols-4 gap-4">
                {photos.map((p) => (
                    <figure key={p.id}>
                        <div className="relative aspect-[8/5] overflow-hidden rounded-[8px] bg-[#EFEFEF]">
                            <Image src={p.image} alt={p.comment || `${restaurantName(p.restaurant)} 메뉴 사진`} fill sizes="240px" className="object-cover" />
                            <Button variant="dark" className="absolute right-2 top-2 !h-7 rounded-full bg-black/60 !px-3 text-[12px]" onClick={() => setDeleteTarget(p)}>삭제</Button>
                        </div>
                        <figcaption className="mt-2">
                            <p className="text-[14px] font-medium">{restaurantName(p.restaurant)} · {MEAL_LABELS[p.meal_time]}{p.is_official && <span className="ml-1 text-[12px] text-[#ED3A3A]">공식</span>}</p>
                            <p className="text-[13px] text-[#8A8A8A]">{p.author?.nickname ?? (p.source === 'INSTAGRAM' ? '인스타그램' : '알 수 없음')} · {hhmm(p.created_at)}</p>
                        </figcaption>
                    </figure>
                ))}
            </div>
            <p className="mt-6 text-[13px] text-[#666666]">공식 사진이 먼저, 그다음 최신순으로 표시됩니다. 삭제하면 앱에서 즉시 사라져요.</p>
            {deleteTarget && (
                <ConfirmDialog
                    title="이 사진을 삭제할까요?"
                    secondary={{ label: '취소', onClick: () => setDeleteTarget(null) }}
                    primary={{ label: '삭제', onClick: remove, disabled: busy }}
                    onClose={() => setDeleteTarget(null)}
                >
                    <p className="mt-2 text-[14px] text-[#666666]">{restaurantName(deleteTarget.restaurant)} · {MEAL_LABELS[deleteTarget.meal_time]} · {deleteTarget.author?.nickname ?? '알 수 없음'}</p>
                </ConfirmDialog>
            )}
        </section>
    );
}
