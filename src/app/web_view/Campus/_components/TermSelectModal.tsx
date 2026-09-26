'use client';

import { useState } from 'react';
import { sameTerm, termLabel, type CourseTerm } from '@/app/web_view/_query';
import { tick } from '@/app/web_view/hooks/haptic';
import { ModalChoiceRow, ModalFrame } from './ModalFrame';

export function TermSelectModal({
    terms,
    term,
    onSave,
    onClose,
}: {
    terms: CourseTerm[];
    term: CourseTerm | null;
    onSave: (term: CourseTerm) => void;
    onClose: () => void;
}) {
    const [picked, setPicked] = useState<CourseTerm | null>(term);

    const save = () => {
        tick();
        if (picked) onSave(picked);
        onClose();
    };

    return (
        <ModalFrame title="학기 선택" onCancel={onClose} onSave={save} saveDisabled={!picked}>
            <div role="radiogroup">
                {terms.map((t) => (
                    <ModalChoiceRow key={termLabel(t)} role="radio" checked={!!picked && sameTerm(t, picked)} onToggle={() => setPicked(t)}>
                        {termLabel(t)}
                    </ModalChoiceRow>
                ))}
            </div>
        </ModalFrame>
    );
}
