'use client';

import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import Image from 'next/image';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiDetail, createMenu, deleteMenu, fetchStore, updateMenu } from '@/lib/api/store';
import type { OpsStore, StoreMenu } from '@/lib/types/store';
import { ConfirmDialog } from '@/app/web_view/_components/ConfirmDialog';
import { Breadcrumb, Button, Card, Field, inputCls, SectionTitle, StatusLine, tdCls, thCls, type Status } from './ui';
import { opsStoreKey } from './keys';

type Draft = { section: string; name: string; price: string; description: string };

const toDraft = (m: StoreMenu | null): Draft => ({ section: m?.section ?? '', name: m?.name ?? '', price: m ? String(m.price) : '', description: m?.description ?? '' });

function MenuForm({ storeId, menu, onDone, onCancel }: { storeId: number; menu: StoreMenu | null; onDone: () => void; onCancel: () => void }) {
    const [draft, setDraft] = useState(() => toDraft(menu));
    const [photo, setPhoto] = useState<{ file: File; url: string } | null>(null);
    const [status, setStatus] = useState<Status>(null);
    const [busy, setBusy] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);

    useEffect(() => () => {
        if (photo) URL.revokeObjectURL(photo.url);
    }, [photo]);

    const set = (key: keyof Draft, value: string) => setDraft((d) => ({ ...d, [key]: value }));

    const onPick = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (file) setPhoto({ file, url: URL.createObjectURL(file) });
    };

    const submit = async () => {
        if (busy) return;
        setBusy(true);
        setStatus(null);
        try {
            const fields = { section: draft.section.trim(), name: draft.name.trim(), price: Number(draft.price), description: draft.description.trim() };
            if (!menu || photo) {
                const fd = new FormData();
                Object.entries(fields).forEach(([k, v]) => fd.append(k, String(v)));
                if (photo) fd.append('photo', photo.file);
                if (menu) await updateMenu(storeId, menu.id, fd);
                else await createMenu(storeId, fd);
            } else {
                await updateMenu(storeId, menu.id, fields);
            }
            onDone();
        } catch (e) {
            setStatus({ ok: false, text: apiDetail(e) });
            setBusy(false);
        }
    };

    const photoUrl = photo?.url ?? (menu?.photo || null);

    return (
        <Card className="mb-5 space-y-3">
            <h3 className="text-[15px] font-semibold">{menu ? '메뉴 수정' : '메뉴 추가'}</h3>
            <Field label="섹션"><input name="section" className={`${inputCls} w-[300px]`} placeholder="예: 덮밥" value={draft.section} onChange={(e) => set('section', e.target.value)} /></Field>
            <Field label="이름"><input name="name" className={`${inputCls} w-[300px]`} value={draft.name} onChange={(e) => set('name', e.target.value)} /></Field>
            <Field label="가격"><input name="price" type="number" min={0} className={`${inputCls} w-[160px]`} value={draft.price} onChange={(e) => set('price', e.target.value)} /></Field>
            <Field label="설명"><input name="description" className={`${inputCls} w-[480px]`} value={draft.description} onChange={(e) => set('description', e.target.value)} /></Field>
            <Field label="사진">
                <div className="flex items-center gap-4">
                    <div className="relative h-16 w-16 overflow-hidden rounded-[6px] bg-[#EFEFEF]">
                        {photoUrl && <Image src={photoUrl} alt="메뉴 사진" fill sizes="64px" className="object-cover" />}
                    </div>
                    <Button onClick={() => fileRef.current?.click()}>파일 선택</Button>
                    <input ref={fileRef} name="photo" type="file" accept="image/*" className="hidden" onChange={onPick} />
                </div>
            </Field>
            <div className="flex items-center justify-end gap-3 pt-1">
                <StatusLine status={status} />
                <Button onClick={onCancel}>취소</Button>
                <Button variant="primary" onClick={submit} disabled={busy || !draft.name.trim() || draft.price === ''}>{menu ? '저장' : '추가'}</Button>
            </div>
        </Card>
    );
}

export default function MenusView({ store, onBack }: { store: OpsStore; onBack: () => void }) {
    const qc = useQueryClient();
    const detail = useQuery({ queryKey: opsStoreKey(store.id), queryFn: () => fetchStore(store.id) });
    const [editing, setEditing] = useState<StoreMenu | null | undefined>(undefined);
    const [deleteTarget, setDeleteTarget] = useState<StoreMenu | null>(null);
    const [status, setStatus] = useState<Status>(null);
    const [busy, setBusy] = useState(false);
    const menus = detail.data?.menus ?? [];

    const refetch = () => qc.invalidateQueries({ queryKey: opsStoreKey(store.id) });

    const run = async (work: () => Promise<unknown>, okText?: string) => {
        if (busy) return;
        setBusy(true);
        setStatus(null);
        try {
            await work();
            if (okText) setStatus({ ok: true, text: okText });
            await refetch();
        } catch (e) {
            setStatus({ ok: false, text: apiDetail(e) });
        } finally {
            setBusy(false);
        }
    };

    // Swap with the neighbour; rows whose order is already out of step (e.g. all 0) get renumbered too.
    const move = (index: number, dir: -1 | 1) => {
        const next = [...menus];
        const other = index + dir;
        if (other < 0 || other >= next.length) return;
        [next[index], next[other]] = [next[other], next[index]];
        run(() => Promise.all(next.map((m, i) => (m.order === i ? null : updateMenu(store.id, m.id, { order: i })))));
    };

    return (
        <section>
            <Breadcrumb parent="입주 업체" onParent={onBack} current={store.name} />
            <SectionTitle right={<Button variant="primary" onClick={() => setEditing(null)} disabled={editing !== undefined}>+ 메뉴 추가</Button>}>메뉴 관리 (대리 편집)</SectionTitle>
            {editing !== undefined && (
                <MenuForm
                    key={editing?.id ?? 'new'}
                    storeId={store.id}
                    menu={editing}
                    onCancel={() => setEditing(undefined)}
                    onDone={() => {
                        setEditing(undefined);
                        setStatus({ ok: true, text: editing ? '메뉴를 수정했어요.' : '메뉴를 추가했어요.' });
                        refetch();
                    }}
                />
            )}
            {detail.isError && <StatusLine status={{ ok: false, text: apiDetail(detail.error) }} />}
            <table className="w-full border-collapse">
                <thead>
                    <tr>
                        <th className={`${thCls} w-[76px]`}>순서</th>
                        <th className={`${thCls} w-[72px]`}>사진</th>
                        <th className={thCls}>이름</th>
                        <th className={`${thCls} w-[110px]`}>가격</th>
                        <th className={thCls}>설명</th>
                        <th className={`${thCls} w-[60px]`}>품절</th>
                        <th className={`${thCls} w-[120px]`}>관리</th>
                    </tr>
                </thead>
                <tbody>
                    {menus.map((m, i) => (
                        <tr key={m.id}>
                            <td className={tdCls}>
                                <div className="flex gap-1 text-[#8A8A8A]">
                                    <button type="button" aria-label="위로" disabled={busy || i === 0} className="disabled:opacity-30" onClick={() => move(i, -1)}>↑</button>
                                    <button type="button" aria-label="아래로" disabled={busy || i === menus.length - 1} className="disabled:opacity-30" onClick={() => move(i, 1)}>↓</button>
                                </div>
                            </td>
                            <td className={tdCls}>
                                <div className="relative h-10 w-10 overflow-hidden rounded-[6px] bg-[#EFEFEF]">
                                    {m.photo && <Image src={m.photo} alt={m.name} fill sizes="40px" className="object-cover" />}
                                </div>
                            </td>
                            <td className={`${tdCls} font-medium`}>
                                {m.name}
                                {m.section && <span className="ml-2 text-[12px] text-[#8A8A8A]">{m.section}</span>}
                            </td>
                            <td className={tdCls}>{m.price.toLocaleString()}원</td>
                            <td className={`${tdCls} text-[#666666]`}>{m.description}</td>
                            <td className={tdCls}>
                                <input
                                    type="checkbox"
                                    aria-label={`${m.name} 품절`}
                                    className="h-4 w-4 accent-[#ED3A3A]"
                                    checked={m.is_sold_out}
                                    disabled={busy}
                                    onChange={(e) => run(() => updateMenu(store.id, m.id, { is_sold_out: e.target.checked }))}
                                />
                            </td>
                            <td className={tdCls}>
                                <div className="flex gap-4">
                                    <Button variant="text" onClick={() => setEditing(m)} disabled={busy}>수정</Button>
                                    <Button variant="text" onClick={() => setDeleteTarget(m)} disabled={busy}>삭제</Button>
                                </div>
                            </td>
                        </tr>
                    ))}
                    {detail.isSuccess && menus.length === 0 && (
                        <tr><td className={`${tdCls} text-center text-[#8A8A8A]`} colSpan={7}>등록된 메뉴가 없어요.</td></tr>
                    )}
                </tbody>
            </table>
            <div className="mt-4 flex items-center gap-4 text-[13px] text-[#8A8A8A]">
                <span>순서는 화살표로 바꿀 수 있어요.</span>
                <StatusLine status={status} />
            </div>
            {deleteTarget && (
                <ConfirmDialog
                    title={`${deleteTarget.name}을(를) 삭제할까요?`}
                    secondary={{ label: '취소', onClick: () => setDeleteTarget(null) }}
                    primary={{
                        label: '삭제',
                        disabled: busy,
                        onClick: () => {
                            const target = deleteTarget;
                            setDeleteTarget(null);
                            run(() => deleteMenu(store.id, target.id), '메뉴를 삭제했어요.');
                        },
                    }}
                    onClose={() => setDeleteTarget(null)}
                />
            )}
        </section>
    );
}
