"use client";

import SearchBar from "@/components/searchBar";
import { useState } from "react";

export default function Home() {
  const [inputValue, setInputValue] = useState("");

  return (
    <div>
      <div className="h-[220px] w-full flex justify-center items-center">
        <SearchBar
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
        />
      </div>
    </div>
  );
}
