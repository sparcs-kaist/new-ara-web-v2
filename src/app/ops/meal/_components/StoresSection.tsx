'use client';

import { useState } from 'react';
import { ZONE_LABELS, type OpsStore, type Zone } from '@/lib/types/store';
import { ActivePill, Button, inputCls, SectionTitle, tdCls, thCls } from './ui';
import StoreForm from './StoreForm';
import StaffView from './StaffView';
import MenusView from './MenusView';

type View = { kind: 'list' } | { kind: 'edit'; store: OpsStore | null } | { kind: 'staff'; store: OpsStore } | { kind: 'menus'; store: OpsStore };

export default function StoresSection({ stores }: { stores: OpsStore[] }) {
    const [view, setView] = useState<View>({ kind: 'list' });
    const [zone, setZone] = useState<Zone | ''>('');
    const [active, setActive] = useState<'' | 'on' | 'off'>('');
    const [q, setQ] = useState('');
    const toList = () => setView({ kind: 'list' });

    if (view.kind === 'edit') return <StoreForm store={view.store} onBack={toList} onSaved={(store) => setView({ kind: 'edit', store })} />;
    if (view.kind === 'staff') return <StaffView store={view.store} onBack={toList} />;
    if (view.kind === 'menus') return <MenusView store={view.store} onBack={toList} />;

    const rows = stores.filter(
        (s) => (!zone || s.zone === zone) && (!active || s.is_active === (active === 'on')) && (!q.trim() || s.name.toLowerCase().includes(q.trim().toLowerCase())),
    );

    return (
        <section>
            <SectionTitle right={<Button variant="primary" onClick={() => setView({ kind: 'edit', store: null })}>+ 업체 추가</Button>}>입주 업체</SectionTitle>
            <div className="mb-4 flex gap-4">
                <select aria-label="구역" className={`${inputCls} w-[132px]`} value={zone} onChange={(e) => setZone(e.target.value as Zone | '')}>
                    <option value="">구역: 전체</option>
                    {(Object.keys(ZONE_LABELS) as Zone[]).map((z) => <option key={z} value={z}>{ZONE_LABELS[z]}</option>)}
                </select>
                <select aria-label="운영" className={`${inputCls} w-[132px]`} value={active} onChange={(e) => setActive(e.target.value as '' | 'on' | 'off')}>
                    <option value="">운영: 전체</option>
                    <option value="on">운영 중</option>
                    <option value="off">중단</option>
                </select>
                <input className={`${inputCls} w-[240px]`} placeholder="이름 검색" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
            <table className="w-full border-collapse">
                <thead>
                    <tr>
                        <th className={thCls}>이름</th>
                        <th className={`${thCls} w-[84px]`}>구역</th>
                        <th className={thCls}>위치</th>
                        <th className={`${thCls} w-[130px]`}>영업시간</th>
                        <th className={`${thCls} w-[90px]`}>운영</th>
                        <th className={`${thCls} w-[190px]`}>관리</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((s) => (
                        <tr key={s.id}>
                            <td className={`${tdCls} font-medium`}>{s.name}</td>
                            <td className={tdCls}>{ZONE_LABELS[s.zone] ?? s.zone}</td>
                            <td className={tdCls}>{s.location}</td>
                            <td className={tdCls}>{s.hours}</td>
                            <td className={tdCls}><ActivePill active={s.is_active} /></td>
                            <td className={tdCls}>
                                <div className="flex gap-4">
                                    <Button variant="text" onClick={() => setView({ kind: 'edit', store: s })}>편집</Button>
                                    <Button variant="text" onClick={() => setView({ kind: 'staff', store: s })}>직원</Button>
                                    <Button variant="text" onClick={() => setView({ kind: 'menus', store: s })} disabled={!s.is_active} title={s.is_active ? undefined : '운영 중인 업체만 메뉴를 편집할 수 있어요'}>메뉴</Button>
                                </div>
                            </td>
                        </tr>
                    ))}
                    {rows.length === 0 && (
                        <tr><td className={`${tdCls} text-center text-[#8A8A8A]`} colSpan={6}>업체가 없어요.</td></tr>
                    )}
                </tbody>
            </table>
            <p className="mt-4 text-[13px] text-[#8A8A8A]">총 {rows.length}개</p>
        </section>
    );
}
