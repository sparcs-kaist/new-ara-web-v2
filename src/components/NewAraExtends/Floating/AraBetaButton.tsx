import React from "react";

export default function AraBetaButton() {
  return (
    <button
      className="
        flex w-[70px] h-[70px] 
        items-center justify-center p-0 
        relative bg-[#ed3a3a] rounded-[35px] 
        border-none cursor-pointer 
        transition-colors duration-200 ease-in-out 
        hover:bg-[#ed3a3a]/90
      "
    >
      <div
        className="
          relative w-8 h-[52px] 
          flex items-center justify-center
        "
      >
        <img
          src="/NewAraExtendIcons/SparcsLogo.svg"
          alt="Sparcs Logo"
          className="
            absolute right-[12px] top-[5px] 
            w-[18px] h-[44px]
          "
        />
        <span
          className="
            absolute w-[9px] top-0 right-[-3px] 
            font-semibold text-white text-base 
            text-center leading-normal whitespace-nowrap
          "
        >
          β
        </span>
      </div>
    </button>
  );
}