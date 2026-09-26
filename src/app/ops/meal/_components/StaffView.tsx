'use client';

import { useState, type KeyboardEvent } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiDetail, isGroupRequired, opsAddStaff, opsFetchStaff, opsRemoveStaff, opsSearchUsers } from '@/lib/api/store';
import type { OpsStaff, OpsStore, OpsUser } from '@/lib/types/store';
import { ConfirmDialog } from '@/app/web_view/_components/ConfirmDialog';
import { Breadcrumb, Button, Card, inputCls, StatusLine, type Status } from './ui';
import { opsStaffKey } from './keys';

function Avatar() {
    return <span className="h-8 w-8 shrink-0 rounded-full bg-[#EFEFEF]" />;
}

export default function StaffView({ store, onBack }: { store: OpsStore; onBack: () => void }) {
    const qc = useQueryClient();
    const staff = useQuery({ queryKey: opsStaffKey(store.id), queryFn: () => opsFetchStaff(store.id) });
    const [q, setQ] = useState('');
    const [results, setResults] = useState<OpsUser[] | null>(null);
    const [searchStatus, setSearchStatus] = useState<Status>(null);
    // user id → server detail for the group_required second step
    const [needsGroup, setNeedsGroup] = useState<Record<number, string>>({});
    const [busy, setBusy] = useState<number | null>(null);
    const [removeTarget, setRemoveTarget] = useState<OpsStaff | null>(null);
    const [removeStatus, setRemoveStatus] = useState<Status>(null);

    const staffIds = new Set((staff.data ?? []).map((s) => s.id));

    const search = async () => {
        const query = q.trim();
        if (query.length < 2) {
            setSearchStatus({ ok: false, text: '2글자 이상 입력해 주세요.' });
            return;
        }
        setSearchStatus(null);
        try {
            setResults(await opsSearchUsers(query));
        } catch (e) {
            setSearchStatus({ ok: false, text: apiDetail(e) });
        }
    };

    const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !e.nativeEvent.isComposing) search();
    };

    const add = async (user: OpsUser, grantGroup = false) => {
        if (busy !== null) return;
        setBusy(user.id);
        try {
            await opsAddStaff(store.id, user.id, grantGroup);
            setNeedsGroup((m) => {
                const next = { ...m };
                delete next[user.id];
                return next;
            });
            setSearchStatus({ ok: true, text: `${user.nickname}님을 직원으로 지정했어요.` });
            qc.invalidateQueries({ queryKey: opsStaffKey(store.id) });
        } catch (e) {
            if (isGroupRequired(e)) setNeedsGroup((m) => ({ ...m, [user.id]: apiDetail(e) }));
            else setSearchStatus({ ok: false, text: apiDetail(e) });
        } finally {
            setBusy(null);
        }
    };

    const remove = async () => {
        if (!removeTarget || busy !== null) return;
        setBusy(removeTarget.id);
        try {
            await opsRemoveStaff(store.id, removeTarget.id);
            setRemoveStatus({ ok: true, text: `${removeTarget.nickname}님을 해제했어요.` });
            qc.invalidateQueries({ queryKey: opsStaffKey(store.id) });
        } catch (e) {
            setRemoveStatus({ ok: false, text: apiDetail(e) });
        } finally {
            setRemoveTarget(null);
            setBusy(null);
        }
    };

    return (
        <section>
            <Breadcrumb parent="입주 업체" onParent={onBack} current={store.name} />
            <h2 className="mb-5 text-[22px] font-bold">직원 지정</h2>
            <div className="flex items-start gap-8">
                <Card className="min-h-[400px] flex-1">
                    <h3 className="mb-3 text-[15px] font-semibold">계정 검색</h3>
                    <div className="mb-2 flex gap-3">
                        <input name="q" className={`${inputCls} flex-1`} placeholder="닉네임 또는 이메일" value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={onKey} />
                        <Button variant="dark" onClick={search}>검색</Button>
                    </div>
                    <StatusLine status={searchStatus} />
                    <ul className="mt-2">
                        {results?.map((u) => {
                            const assigned = staffIds.has(u.id);
                            return (
                                <li key={u.id} className="border-b border-[#F0F0F0] py-3 last:border-0">
                                    <div className="flex items-center gap-3">
                                        <Avatar />
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-[14px] font-medium">{u.nickname}</p>
                                            <p className="truncate text-[13px] text-[#8A8A8A]">{u.email}</p>
                                        </div>
                                        {assigned ? (
                                            <Button disabled className="bg-[#F0F0F0]">지정됨</Button>
                                        ) : (
                                            <Button variant="primary" onClick={() => add(u)} disabled={busy !== null || u.id in needsGroup}>지정</Button>
                                        )}
                                    </div>
                                    {needsGroup[u.id] && !assigned && (
                                        <div className="mt-2 flex items-center justify-between gap-3 pl-11">
                                            <p className="text-[13px] text-[#ED3A3A]">{needsGroup[u.id]}</p>
                                            <Button onClick={() => add(u, true)} disabled={busy !== null}>그룹 부여하고 지정</Button>
                                        </div>
                                    )}
                                </li>
                            );
                        })}
                        {results?.length === 0 && <li className="py-3 text-[13px] text-[#8A8A8A]">검색 결과가 없어요.</li>}
                    </ul>
                </Card>
                <Card className="min-h-[400px] flex-1">
                    <h3 className="mb-3 text-[15px] font-semibold">지정된 직원 ({staff.data?.length ?? 0})</h3>
                    <StatusLine status={removeStatus} />
                    {staff.isError && <StatusLine status={{ ok: false, text: apiDetail(staff.error) }} />}
                    <ul>
                        {staff.data?.map((s) => (
                            <li key={s.id} className="flex items-center gap-3 border-b border-[#F0F0F0] py-3 last:border-0">
                                <Avatar />
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-[14px] font-medium">{s.nickname}</p>
                                    <p className="truncate text-[13px] text-[#8A8A8A]">{s.email}</p>
                                </div>
                                <Button onClick={() => setRemoveTarget(s)} disabled={busy !== null}>해제</Button>
                            </li>
                        ))}
                        {staff.data?.length === 0 && <li className="py-3 text-[13px] text-[#8A8A8A]">아직 지정된 직원이 없어요.</li>}
                    </ul>
                </Card>
            </div>
            <p className="mt-6 text-[13px] text-[#666666]">직원으로 지정되면 앱에서 해당 업체의 메뉴를 직접 편집할 수 있어요.</p>
            {removeTarget && (
                <ConfirmDialog
                    title={`${removeTarget.nickname}님을 직원에서 해제할까요?`}
                    secondary={{ label: '취소', onClick: () => setRemoveTarget(null) }}
                    primary={{ label: '해제', onClick: remove, disabled: busy !== null }}
                    onClose={() => setRemoveTarget(null)}
                />
            )}
        </section>
    );
}
