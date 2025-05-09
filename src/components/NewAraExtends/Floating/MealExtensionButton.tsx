import React from "react";

export default function MealExtensionButton() {
    return (
        <button
            className="
                flex flex-row items-center justify-center
                p-[15px] gap-[10px] 
                relative w-[70px] h-[70px] 
                bg-[#FDF0F0] shadow-md 
                rounded-[35px]
            "
        >
            <img
                src="NewAraExtendIcons/cup-straw.svg" // public 폴더 기준 경로
                alt="Cup with Straw Icon"
                className="flex w-[26px] h-[40px] mx-auto"
            />
        </button>
    );
}

//@todo : svg icon color 를 #c62626 으로 변경하기