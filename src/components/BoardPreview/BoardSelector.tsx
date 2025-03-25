"use client";

import { useState } from "react";

interface BoardSelectorProps {
  onSelect: (boardType: string) => void;
  boardData: Record<string, { type: string; title: string }>;
}

export default function BoardSelector({ onSelect, boardData }: BoardSelectorProps) {
  const [selected, setSelected] = useState("talk");

  const handleSelect = (boardType: string) => {
    setSelected(boardType);
    onSelect(boardType);
  };

  return (
    <div className="items-center justify-center p-6 border border-gray-200 rounded-[20px] shadow-sm w-[857px]">
      {/* 📌 탭 메뉴 */}
      <div className="flex justify-between p-2 border-b border-gray-300">
        {Object.keys(boardData).map((key) => (
          <button
            key={key}
            className={`px-4 py-2 rounded-md ${
              selected === key ? "text-black font-bold" : "text-gray-500"
            }`}
            onClick={() => handleSelect(key)}
          >
            {boardData[key].title}
          </button>
        ))}
      </div>
    </div>
  );
}
