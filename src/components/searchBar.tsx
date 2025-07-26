"use client";
import { useRouter } from "next/navigation";
import Image from "next/image";
import React from 'react';

interface TextInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const SearchBar: React.FC<TextInputProps> = ({ value, onChange}) => {
  const router = useRouter();

  // 검색 실행 함수
  const handleSearch = () => {
    if (value.trim() !== "") {
      router.push(`/board?query=${encodeURIComponent(value)}`);
    }
  };

  // Enter 키 입력 처리
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div className="flex h-[56px] border-[2px] bg-white border-ara_red rounded-full
      px-4 py-2 space-x-2 w-[90%] max-w-[650px] shadow-sm shadow-ara_red/20">
      <input
        type="search"
        className="w-full focus:outline-none focus:ring-0 placeholder-ara_red_bright font-medium bg-transparent"
        placeholder="검색어를 입력하세요."
        value={value}
        onChange={onChange}
        onKeyDown={handleKeyDown} 
  
      />
      <button onClick={handleSearch}>
        <Image src="SearchBar_search.svg" width={28} height={28} alt="search" />
      </button>
    </div>
  );
};

export default SearchBar;
