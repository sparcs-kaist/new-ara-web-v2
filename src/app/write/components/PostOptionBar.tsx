//PostOptionBar.tsx
'use client';

import React, { useState, useEffect } from "react";
import { OptionCheckbox, OptionSelect } from "./Option";

interface ApiBoard {
  id: number
  ko_name: string
  name_type: number           // 1=Regular, 3=Regular+Anonymous, 4=Realname only
  topics: Array<{ id: number; ko_name: string }>
}

interface BoardOptionBarProps {
  boards: ApiBoard[]
  defaultBoardId?: number
  defaultCategoryId?: string
  onChangeBoard: (boardId: number) => void
  onChangeCategory: (category: string) => void
  onChangeAnonymous: (anonymous: boolean) => void
  onChangeSocial: (isSocial: boolean) => void
  onChangeSexual: (isSexual: boolean) => void
  disabled?: boolean
  isEditMode?: boolean
}

export const BoardOptionBar = ({
  boards,
  defaultBoardId,
  defaultCategoryId,
  onChangeBoard,
  onChangeCategory,
  onChangeAnonymous,
  onChangeSocial,
  onChangeSexual,
  disabled = false,
  isEditMode = false,
}: BoardOptionBarProps) => {
  const [selectedBoardId, setSelectedBoardId] = useState<number | null>(defaultBoardId ?? boards[0]?.id ?? null);
  const currentBoard = boards.find(b => b.id === selectedBoardId) ?? null;
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(
    defaultCategoryId === '' || defaultCategoryId == null ? null : Number(defaultCategoryId)
  );

  useEffect(() => { if (defaultBoardId) setSelectedBoardId(defaultBoardId); }, [defaultBoardId]);
  useEffect(() => {
    setSelectedCategoryId(defaultCategoryId === '' || defaultCategoryId == null ? null : Number(defaultCategoryId));
  }, [defaultCategoryId]);

  const [political, setPolitical] = useState(false);
  const [adult, setAdult] = useState(false);
  const [anonymous, setAnonymous] = useState(false);

  const handleBoardChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = Number(e.target.value);
    setSelectedBoardId(id);
    setSelectedCategoryId(null);
    setAnonymous(false);
    onChangeAnonymous(false);
    onChangeBoard(id);
    onChangeCategory('');
  };

  return (
    <div className="flex items-center gap-x-4 gap-y-2 sm:mb-6 mb-2 flex-wrap">
      {/* 게시판 선택 */}
      <OptionSelect
        value={selectedBoardId ?? ''}
        onChange={handleBoardChange}
        disabled={isEditMode || disabled}
        options={boards.map(b => ({ value: b.id, label: b.ko_name }))}
      />

      {/* 카테고리 선택 */}
      <OptionSelect
        className={selectedCategoryId === null ? 'text-gray-500' : 'text-black'}
        value={selectedCategoryId ?? ''}
        placeholder="말머리 없음"
        onChange={(e) => {
          const id = Number(e.target.value);
          setSelectedCategoryId(id);
          onChangeCategory(id ? String(id) : '');
          onChangeAnonymous(anonymous);
        }}
        disabled={isEditMode || disabled}
        options={(currentBoard?.topics ?? []).map((t) => ({ value: t.id, label: t.ko_name }))}
      />

      {/* 옵션 토글 공통 레이아웃 */}
      <div className="flex items-center gap-x-3 px-2 flex-wrap">
        {currentBoard?.name_type === 3 && (
          <OptionCheckbox
            label="익명"
            checked={anonymous}
            onChange={(e) => { setAnonymous(e.target.checked); onChangeAnonymous(e.target.checked); }}
            disabled={disabled}
          />
        )}
        <OptionCheckbox
          label="정치글"
          checked={political}
          onChange={(e) => { setPolitical(e.target.checked); onChangeSocial(e.target.checked); }}
          disabled={disabled}
        />
        <OptionCheckbox
          label="성인글"
          checked={adult}
          onChange={(e) => { setAdult(e.target.checked); onChangeSexual(e.target.checked); }}
          disabled={disabled}
        />
        {currentBoard?.name_type === 4 && (
          <span className="text-xs text-red-500 font-semibold whitespace-nowrap flex-shrink-0">
            실명제 게시판입니다
          </span>
        )}
      </div>
    </div>
  );
};

interface CourseOptionBarProps {
  courses: Course[]
  defaultCourseId?: number
  onChangeCourse: (boardId: number) => void
  onChangeAnonymous: (anonymous: boolean) => void
  onChangeSocial: (isSocial: boolean) => void
  onChangeSexual: (isSexual: boolean) => void
  disabled?: boolean
  isEditMode?: boolean
}

export const CourseOptionBar = ({
  courses,
  defaultCourseId,
  onChangeCourse,
  onChangeAnonymous,
  onChangeSocial,
  onChangeSexual,
  disabled = false,
  isEditMode = false,
}: CourseOptionBarProps) => {
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(defaultCourseId ?? courses[0]?.id ?? null);

  useEffect(() => { if (defaultCourseId) setSelectedCourseId(defaultCourseId); }, [defaultCourseId]);
  const [political, setPolitical] = useState(false);
  const [adult, setAdult] = useState(false);
  const [anonymous, setAnonymous] = useState(false);

  const handleCourseChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = Number(e.target.value);
    setSelectedCourseId(id);
    setAnonymous(false);
    onChangeAnonymous(false);
    onChangeCourse(id);
  };

  return (
    <div className="flex items-center gap-x-4 gap-y-2 sm:mb-6 mb-2 flex-wrap">
      {/* 게시판 선택 */}
      <OptionSelect
        value={selectedCourseId ?? ''}
        onChange={handleCourseChange}
        disabled={isEditMode || disabled}
        options={courses.map(c => ({ value: c.id, label: c.title }))}
      />

      {/* 옵션 토글 공통 레이아웃 */}
      <div className="flex items-center gap-x-3 px-2 flex-wrap">
        <OptionCheckbox
          label="익명"
          checked={anonymous}
          onChange={(e) => { setAnonymous(e.target.checked); onChangeAnonymous(e.target.checked); }}
          disabled={disabled}
        />
        <OptionCheckbox
          label="정치글"
          checked={political}
          onChange={(e) => { setPolitical(e.target.checked); onChangeSocial(e.target.checked); }}
          disabled={disabled}
        />
        <OptionCheckbox
          label="성인글"
          checked={adult}
          onChange={(e) => { setAdult(e.target.checked); onChangeSexual(e.target.checked); }}
          disabled={disabled}
        />
      </div>
    </div>
  );
};
