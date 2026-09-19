"use client";

import Modal from "@/components/common/Modal";
import { useEffect, useState } from "react";
import { useMajors, useUserMajorMutation } from "@/lib/query/campus";

const CheckIcon = () => (
    <svg width="14" height="16" viewBox="0 0 14 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M5.13042 10.5833L3.10625 8.27C2.87875 8.01 2.51125 8.01 2.28375 8.27C2.05625 8.53 2.05625 8.95 2.28375 9.21L4.72209 11.9967C4.94959 12.2567 5.31709 12.2567 5.54459 11.9967L11.7163 4.94333C11.9438 4.68333 11.9438 4.26333 11.7163 4.00333C11.4888 3.74333 11.1213 3.74333 10.8938 4.00333L5.13042 10.5833Z" fill="white"/>
    </svg>
);

interface MajorSelectModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const MajorSelectModal = ({ isOpen, onClose }: MajorSelectModalProps) => {
    const { data: majors } = useMajors();
    const { mutate } = useUserMajorMutation();
    const [selected, setSelected] = useState<Set<number>>(new Set());

    useEffect(() => {
        if (majors) setSelected(new Set(majors.filter((m) => m.is_added).map((m) => m.std_dept_id)));
    }, [majors, isOpen]);

    const departments = majors ?? [];

    const toggle = (dept: Major) => {
        if (dept.is_mine) return;
        setSelected((selected) => {
            const newSelected = new Set(selected);
            if (!newSelected.delete(dept.std_dept_id)) newSelected.add(dept.std_dept_id);
            return newSelected;
        });
    };

    const save = () => {
        departments.forEach((dept) => {
            const checked = selected.has(dept.std_dept_id);
            if (checked !== dept.is_added) mutate({ stdDeptId: dept.std_dept_id, add: checked });
        });
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <div className="w-[844px] max-w-[95vw] bg-white/95 rounded-2xl shadow-[0px_0px_6.1px_0px_rgba(0,0,0,0.25)] flex flex-col overflow-hidden">
                <div className="self-stretch pl-5 pr-7 pt-6 pb-7 flex justify-center items-center">
                    <div className="text-black text-xl font-semibold">학과 선택</div>
                </div>

                {/* 2. Content: 스크롤 가능한 리스트 영역 (h-[459px]) */}
                <div className="self-stretch h-[459px] px-6 overflow-y-auto scrollbar-hide">
                    {departments.map((dept, index) => (
                        <div key={dept.std_dept_id} className="flex flex-col" onClick={() => toggle(dept)}>
                            <div
                                className={`self-stretch px-2.5 py-3 flex justify-start items-center gap-5 transition-colors group ${dept.is_mine ? 'cursor-default' : 'cursor-pointer'} ${selected.has(dept.std_dept_id) ? 'bg-rose-50' : 'hover:bg-zinc-50'}`}
                            >
                                {selected.has(dept.std_dept_id) ? (
                                    <div className="w-5 h-5 bg-red-500 rounded-xl flex items-center justify-center">
                                        <CheckIcon />
                                    </div>
                                ) : (
                                    <div className="w-5 h-5 rounded-full border border-gray-300" />
                                )}

                                <div className="text-black text-base font-normal leading-4">
                                    {dept.major_name}
                                </div>
                            </div>

                            {index !== departments.length - 1 && (
                                <div className="self-stretch h-px bg-gray-200" />
                            )}
                        </div>
                    ))}
                </div>

                <div className="self-stretch flex justify-start items-center">
                    <button
                        onClick={onClose}
                        className="flex-1 px-2.5 py-3 border-r border-t border-gray-200 flex justify-center items-center hover:bg-zinc-50 transition-colors"
                    >
                        <span className="text-red-500 text-xl font-normal">취소</span>
                    </button>
                    <button
                        onClick={save}
                        className="flex-1 px-2.5 py-3 border-t border-gray-200 flex justify-center items-center hover:bg-zinc-50 transition-colors"
                    >
                        <span className="text-red-500 text-xl font-bold">저장</span>
                    </button>
                </div>
            </div>
        </Modal>
    );
};