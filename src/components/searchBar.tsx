import React from "react";

interface TextInputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onReset: () => void; // 버튼 클릭 시 실행될 함수 추가
}

const SearchBar: React.FC<TextInputProps> = ({ label, value, onChange, onReset }) => {
  return (
    <div className="flex items-center space-x-2 w-[550px] h-[56px] bg-red-50">
      <div className="flex flex-col flex-grow">
        {label && <label className="text-sm font-medium text-gray-700">{label}</label>}
        <input
          type="text"
          className="border rounded-md p-2 w-full focus:none"
          placeholder="검색어를 입력하세요."
          value={value}
          onChange={onChange}
        />
      </div>
      <button
        className="px-4 py-2 text-white rounded-md h-[28px] w-[28px]"
        onClick={onReset} // 버튼 클릭 시 실행
      >
        <img src="/search.png"/>
      </button>
    </div>
  );
};

export default SearchBar;
