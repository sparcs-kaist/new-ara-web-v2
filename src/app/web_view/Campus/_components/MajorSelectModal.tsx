'use client';

import { useEffect, useState } from 'react';
import { Spinner } from '@/app/web_view/_components';
import { useMajors, useUserMajorMutation } from '@/app/web_view/_query';
import { tick } from '@/app/web_view/hooks/haptic';
import { apiDetail } from '@/lib/api/delivery';
import { ModalChoiceRow, ModalFrame } from './ModalFrame';

export function MajorSelectModal({ onClose }: { onClose: () => void }) {
    const { data: majors, isPending, isError, error } = useMajors();
    const { mutateAsync, isPending: saving, error: saveError } = useUserMajorMutation();
    const [selected, setSelected] = useState<Set<number>>(new Set());

    useEffect(() => {
        if (majors) setSelected(new Set(majors.filter((m) => m.is_added || m.is_mine).map((m) => m.std_dept_id)));
    }, [majors]);

    const toggle = (major: Major) =>
        setSelected((prev) => {
            const next = new Set(prev);
            if (!next.delete(major.std_dept_id)) next.add(major.std_dept_id);
            return next;
        });

    const save = async () => {
        if (saving) return;
        tick();
        const changes = (majors ?? [])
            .filter((m) => !m.is_mine && selected.has(m.std_dept_id) !== m.is_added)
            .map((m) => ({ stdDeptId: m.std_dept_id, add: !m.is_added }));
        try {
            if (changes.length) await mutateAsync(changes);
            onClose();
        } catch {
            // The mutation's error shows above the buttons; the modal stays open.
        }
    };

    return (
        <ModalFrame title="학과 선택" onCancel={onClose} onSave={save} saveDisabled={isPending || saving} message={saveError && apiDetail(saveError)}>
            {isPending ? (
                <div className="flex justify-center py-10">
                    <Spinner size={24} />
                </div>
            ) : isError ? (
                <p className="py-10 text-center text-[14px] text-[#BBBBBB]">{apiDetail(error)}</p>
            ) : (
                majors.map((m) => (
                    <ModalChoiceRow key={m.std_dept_id} checked={selected.has(m.std_dept_id)} locked={m.is_mine} onToggle={() => toggle(m)}>
                        {m.major_name}
                    </ModalChoiceRow>
                ))
            )}
        </ModalFrame>
    );
}
