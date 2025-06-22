//PostOptionBar.tsx
'use client';

import React, { useState } from "react";
import Image from 'next/image'
import DropdownArrowDown from '@/assets/Icon/dropdown-arrow-down.svg';

const boardOptions = [
  {
    name: "학생단체",
    categories: ["말머리 없음", "총학", "학복위", "생자회", "새학", "협동조합"],
    allowAnonymous: false,
    realname: false,
  },
  {
    name: "구인구직",
    categories: ["말머리 없음", "카풀", "기숙사", "실험", "채용", "인턴", "과외"],
    allowAnonymous: false,
    realname: false,
  },
  {
    name: "장터",
    categories: ["말머리 없음", "팝니다", "삽니다"],
    allowAnonymous: false,
    realname: false,
  },
  {
    name: "입주업체 피드백",
    categories: ["말머리 없음", "이벤트"],
    allowAnonymous: false,
    realname: false,
  },
  {
    name: "자유게시판",
    categories: ["말머리 없음", "돈", "게임", "연애", "분실물"],
    allowAnonymous: true,
    realname: false,
  },
  {
    name: "입주 업체 공지",
    categories: ["말머리 없음"],
    allowAnonymous: false,
    realname: false,
  },
  {
    name: "동아리",
    categories: ["말머리 없음"],
    allowAnonymous: false,
    realname: false,
  },
  {
    name: "부동산",
    categories: ["말머리 없음"],
    allowAnonymous: false,
    realname: false,
  },
  {
    name: "학교에게 전합니다",
    categories: ["말머리 없음"],
    allowAnonymous: false,
    realname: true,
  },
  {
    name: "아라 피드백 ",
    categories: ["말머리 없음"],
    allowAnonymous: false,
    realname: false,
  },
];

interface PostOptionBarProps {
  onChangeBoard: (board: string) => void;
  onChangeCategory: (category: string) => void;
  onChangeAnonymous: (anonymous: boolean) => void;
  onChangeSocial: (isSocial: boolean) => void;    // ← 추가
  onChangeSexual: (isSexual: boolean) => void;    // ← 추가
}

const PostOptionBar: React.FC<PostOptionBarProps> = ({
  onChangeBoard,
  onChangeCategory,
  onChangeAnonymous,
  onChangeSocial,
  onChangeSexual,
 }) => {
   const [selectedBoard, setSelectedBoard] = useState(boardOptions[0].name);
   const [selectedCategory, setSelectedCategory] = useState(boardOptions[0].categories[0]);
   const [political, setPolitical] = useState(false);
   const [adult, setAdult] = useState(false);
   const [anonymous, setAnonymous] = useState(false);

   const currentBoard = boardOptions.find((b) => b.name === selectedBoard)!;

   const handleBoardChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
     const boardName = e.target.value;
     const board = boardOptions.find((b) => b.name === boardName)!;
     setSelectedBoard(boardName);
     setSelectedCategory(board.categories[0]);
     setAnonymous(false);
     onChangeBoard(boardName);
     onChangeCategory(board.categories[0]);
     onChangeAnonymous(false);
   };

   const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
     setSelectedCategory(e.target.value);
     onChangeCategory(e.target.value);
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
           className="appearance-none border border-gray-300 rounded px-3 py-2 text-black pr-8"
           value={selectedBoard}
           onChange={e => {
             handleBoardChange(e);
             setIsBoardOpen(false);
           }}
           onFocus={handleBoardFocus}
           onBlur={handleBoardBlur}
         >
           {boardOptions.map((board, idx) => (
             <option
               key={board.name}
               value={board.name}
               className={idx === 0 ? "text-gray-400" : "text-black"}
               style={idx === 0 ? { color: "#9ca3af" } : { color: "#000" }}
             >
               {board.name}
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

       <div className="relative">
         <select
           className="appearance-none border border-gray-300 rounded px-3 py-2 text-black pr-8"
           value={selectedCategory}
           onChange={e => {
             handleCategoryChange(e);
             setIsCategoryOpen(false);
           }}
           onFocus={handleCategoryFocus}
           onBlur={handleCategoryBlur}
         >
           {currentBoard.categories.map((cat, idx) => (
             <option
               key={cat}
               value={cat}
               className={idx === 0 ? "text-gray-400" : "text-black"}
               style={idx === 0 ? { color: "#9ca3af" } : { color: "#000" }}
             >
               {cat}
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

       {currentBoard.allowAnonymous && !currentBoard.realname && (
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

       {currentBoard.realname && (
         <span className="text-xs text-red-500 font-semibold">
           실명제 게시판입니다
         </span>
       )}
     </div>
   );
};

export default PostOptionBar;
