//PostOptionBar.tsx
'use client';

import React, { useState } from "react";
import Image from 'next/image'
import DropdownArrowDown from '@/assets/Icon/dropdown-arrow-down.svg';

interface ApiBoard {
  id: number
  ko_name: string
  name_type: number           // 1=Regular, 3=Regular+Anonymous, 4=Realname only
  topics: Array<{ id: number; ko_name: string }>
}

interface PostOptionBarProps {
  boards: ApiBoard[]
  defaultBoardId?: number       // ← 추가
  defaultCategoryId?: string    // ← 추가 (string '' 또는 숫자문자열)
  onChangeBoard: (boardId: number) => void
  onChangeCategory: (category: string) => void
  onChangeAnonymous: (anonymous: boolean) => void
  onChangeSocial: (isSocial: boolean) => void
  onChangeSexual: (isSexual: boolean) => void
}

const PostOptionBar: React.FC<PostOptionBarProps> = ({
  boards,
  defaultBoardId,
  defaultCategoryId,
  onChangeBoard,
  onChangeCategory,
  onChangeAnonymous,
  onChangeSocial,
  onChangeSexual,
 }) => {
  // boards[0]가 로드되기 전까지 빈 상태 방지
  const [selectedBoardId, setSelectedBoardId] = useState<number | null>(
    // 부모에서 넘겨준 defaultBoardId 우선, 없으면 기존 로직
    defaultBoardId ?? boards[0]?.id ?? null
  );
  const currentBoard = boards.find(b => b.id === selectedBoardId) ?? null;
  // 말머리 선택: null 이면 “말머리 없음”
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(
    // defaultCategoryId가 '' 이면 null, 숫자문자열이면 그 숫자로
    defaultCategoryId === '' || defaultCategoryId == null
      ? null
      : Number(defaultCategoryId)
  );

   // boolean toggles
   const [political, setPolitical] = useState(false);
   const [adult, setAdult] = useState(false);
   // 익명 여부: board.name_type===3에서만 토글 가능
   const [anonymous, setAnonymous] = useState(false);

   const handleBoardChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
     const id = Number(e.target.value);
     setSelectedBoardId(id);
     // 보드 변경 시 항상 “말머리 없음” (빈 값)으로 초기화
     setSelectedCategoryId(null);
     // board.name_type에 따라 익명 기본값 및 부모 콜백
     const board = boards.find(b => b.id === id)!
     if (board.name_type === 3) {
       setAnonymous(false)
       onChangeAnonymous(false)
     } else {
       // 1 또는 4: 익명 불가
       setAnonymous(false)
       onChangeAnonymous(false)
     }
     onChangeBoard(id);
     onChangeCategory('');
   };

   const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
     const id = Number(e.target.value);
     setSelectedCategoryId(id);
     onChangeCategory(id ? String(id) : '');
     onChangeAnonymous(anonymous);
   };

   const handleAnonymousChange = (e: React.ChangeEvent<HTMLInputElement>) => {
     setAnonymous(e.target.checked);
     onChangeAnonymous(e.target.checked);
   };

   const handlePoliticalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
     setPolitical(e.target.checked);
     onChangeSocial(e.target.checked);
   };

   const handleAdultChange = (e: React.ChangeEvent<HTMLInputElement>) => {
     setAdult(e.target.checked);
     onChangeSexual(e.target.checked);
   };

   const [isBoardOpen, setIsBoardOpen] = useState(false);
   const [isCategoryOpen, setIsCategoryOpen] = useState(false);

   const handleBoardFocus = () => setIsBoardOpen(true);
   const handleBoardBlur = () => setIsBoardOpen(false);
   const handleCategoryFocus = () => setIsCategoryOpen(true);
   const handleCategoryBlur = () => setIsCategoryOpen(false);

   return (
     <div className="flex items-center gap-4 mb-6">
       <div className="relative">
         <select
           className="appearance-none px-3 py-2 pr-8 border border-gray-300 rounded text-black"
           value={selectedBoardId ?? ''}
           onChange={handleBoardChange}
           onFocus={handleBoardFocus}
           onBlur={handleBoardBlur}
         >
           {boards.map(b => (
             <option key={b.id} value={b.id}>
               {b.ko_name}
             </option>
           ))}
         </select>
         <span
           className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 transition-transform duration-200"
           style={{
             transform: isBoardOpen
               ? "translateY(-50%) rotate(180deg)"
               : "translateY(-50%) rotate(0deg)",
           }}
         >
           <Image src={DropdownArrowDown} alt="arrow" className="w-4 h-4" />
         </span>
       </div>

       { /* topic dropdown */ }
       <div className="relative">
         <select
           className={`appearance-none px-4 py-2 pr-8 border rounded ${
             selectedCategoryId === null
               ? 'text-gray-500'
               : 'text-black'
           }`}
           value={selectedCategoryId ?? ''}
           onChange={handleCategoryChange}
           onFocus={handleCategoryFocus}
           onBlur={handleCategoryBlur}
         >
         {/* 항상 첫 번째에 “말머리 없음” */}
         <option value="">말머리 없음</option>
         {currentBoard?.topics.map(t => (
           <option key={t.id} value={t.id}>
             {t.ko_name}
           </option>
         ))}
         </select>
         <span
           className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 transition-transform duration-200"
           style={{
             transform: isCategoryOpen
               ? "translateY(-50%) rotate(180deg)"
               : "translateY(-50%) rotate(0deg)",
           }}
         >
           <Image src={DropdownArrowDown} alt="arrow" className="w-4 h-4" />
         </span>
       </div>

       {currentBoard && currentBoard.name_type === 3 && (
         <label className="flex items-center gap-1 text-sm">
           <input
             type="checkbox"
             checked={anonymous}
             onChange={handleAnonymousChange}
             className="accent-red-500"
           />
           익명
         </label>
       )}

       <label className="flex items-center gap-1 text-sm">
         <input
           type="checkbox"
           checked={political}
           onChange={handlePoliticalChange}
           className="accent-red-500"
         />
         정치글
       </label>

       <label className="flex items-center gap-1 text-sm">
         <input
           type="checkbox"
           checked={adult}
           onChange={handleAdultChange}
           className="accent-red-500"
         />
         성인글
       </label>

       {currentBoard && currentBoard.name_type === 4 && (
         <span className="text-xs text-red-500 font-semibold">
           실명제 게시판입니다
         </span>
       )}
     </div>
   );
};

export default PostOptionBar;
