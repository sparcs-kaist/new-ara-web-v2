//PostOptionBar.tsx
//게시글 작성 페이지에서 게시판, 말머리, 옵션 (성인글, 정치글, 익명)을 설정하기 위한 상단 헤더.
'use client';

import React, { useState } from "react";

// 게시판, 말머리, 익명 가능 여부 데이터
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
		realname: true, // 실명제
	},
	{
		name: "아라 피드백 ",
		categories: ["말머리 없음"],
		allowAnonymous: false,
		realname: false,
	},
];

interface PostOptionBarProps {
	onChange?: (options: {
		board: string;
		category: string;
		anonymous: boolean;
	}) => void;
}

const PostOptionBar: React.FC<PostOptionBarProps> = ({ onChange }) => {
	const [selectedBoard, setSelectedBoard] = useState(boardOptions[0].name);
	const [selectedCategory, setSelectedCategory] = useState(
		boardOptions[0].categories[0]
	);
	const [anonymous, setAnonymous] = useState(false);

	// 현재 선택된 게시판 정보
	const currentBoard = boardOptions.find((b) => b.name === selectedBoard)!;

	// 게시판 변경 시 말머리, 익명 상태 초기화
	const handleBoardChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		const boardName = e.target.value;
		const board = boardOptions.find((b) => b.name === boardName)!;
		setSelectedBoard(boardName);
		setSelectedCategory(board.categories[0]);
		setAnonymous(false);
		onChange?.({
			board: boardName,
			category: board.categories[0],
			anonymous: false,
		});
	};

	// 말머리 변경
	const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		setSelectedCategory(e.target.value);
		onChange?.({ board: selectedBoard, category: e.target.value, anonymous });
	};

	// 익명 체크박스 변경
	const handleAnonymousChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setAnonymous(e.target.checked);
		onChange?.({
			board: selectedBoard,
			category: selectedCategory,
			anonymous: e.target.checked,
		});
	};

	return (
		<div className="flex items-center gap-4 mb-6">
			{/* 게시판 드롭다운 */}
			<select
				className="border border-gray-300 rounded px-3 py-2"
				value={selectedBoard}
				onChange={handleBoardChange}
			>
				{boardOptions.map((board) => (
					<option key={board.name} value={board.name}>
						{board.name}
					</option>
				))}
			</select>

			{/* 말머리 드롭다운 */}
			<select
				className="border border-gray-300 rounded px-3 py-2"
				value={selectedCategory}
				onChange={handleCategoryChange}
			>
				{currentBoard.categories.map((cat) => (
					<option key={cat} value={cat}>
						{cat}
					</option>
				))}
			</select>

			{/* 익명 옵션 */}
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
			{/* 실명제 안내 */}
			{currentBoard.realname && (
				<span className="text-xs text-red-500 font-semibold">
					실명제 게시판입니다
				</span>
			)}
		</div>
	);
};

export default PostOptionBar;
