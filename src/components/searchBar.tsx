"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";

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
    <div className="flex h-[56px] border-[2px] border-ara_red rounded-[16px] px-4 py-2 space-x-2 w-[90%] max-w-[550px]">
      <input
        type="search"
        className="w-full focus:outline-none focus:ring-0 placeholder-ara_red_bright"
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
