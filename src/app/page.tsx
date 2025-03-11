"use client";

import SearchBar from "@/components/searchBar";
import {useState} from 'react';

export default function Home() {
  const [inputValue, setInputValue] = useState("");
  return (
    <div>
      <SearchBar
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onReset={() => setInputValue(inputValue)}
      />
      <p className="mt-2 text-gray-700">입력된 값: {inputValue}</p>
      <h1>Hello, World!</h1>
    </div>
  );
}
