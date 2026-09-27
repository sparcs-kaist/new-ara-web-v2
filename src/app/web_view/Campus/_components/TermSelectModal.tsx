'use client';

import { useState } from 'react';
import { seasonLabel, type CourseTerm } from '@/app/web_view/_query';
import { tick } from '@/app/web_view/hooks/haptic';
import { ModalChoiceRow, ModalFrame } from './ModalFrame';

export function TermSelectModal({
    mode,
    terms,
    term,
    onSave,
    onClose,
}: {
    mode: 'year' | 'season';
    terms: CourseTerm[];
    term: CourseTerm;
    onSave: (term: CourseTerm) => void;
    onClose: () => void;
}) {
    const options =
        mode === 'year'
            ? [...new Set(terms.map((t) => t.year))]
            : terms
                  .filter((t) => t.year === term.year)
                  .map((t) => t.semester)
                  .sort((a, b) => a - b);
    const [picked, setPicked] = useState(mode === 'year' ? term.year : term.semester);

    // terms come newest first, so a year without the current season falls back to its newest one.
    const save = () => {
        tick();
        if (mode === 'season') {
            onSave({ year: term.year, semester: picked });
        } else {
            const seasons = terms.filter((t) => t.year === picked);
            onSave(seasons.find((t) => t.semester === term.semester) ?? seasons[0]);
        }
        onClose();
    };

    return (
        <ModalFrame title={mode === 'year' ? '연도 선택' : '학기 선택'} onCancel={onClose} onSave={save}>
            <div role="radiogroup">
                {options.map((option) => (
                    <ModalChoiceRow key={option} role="radio" checked={option === picked} onToggle={() => setPicked(option)}>
                        {mode === 'year' ? `${option}년도` : seasonLabel(option)}
                    </ModalChoiceRow>
                ))}
            </div>
        </ModalFrame>
    );
}
