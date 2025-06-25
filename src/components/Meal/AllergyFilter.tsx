import React, { useState } from "react";
import { initialAllergens } from "./utils";

// 알레르기 항목의 타입 정의
interface Allergen {
  id: number;
  name: string;
  selected: boolean;
}

// props 인터페이스 정의
interface AllergyFilterProps {
  onAllergyChange: (selectedAllergies: Allergen[]) => void;
  initialAllergies?: Allergen[];
}

const AllergyFilter = ({ onAllergyChange, initialAllergies = initialAllergens }: AllergyFilterProps) => {
  const [allergens, setAllergens] = useState(initialAllergies);

  const toggleAllergen = (id: number) => {
    const updatedAllergens = allergens.map((allergen) =>
      allergen.id === id
        ? { ...allergen, selected: !allergen.selected }
        : allergen
    );
    setAllergens(updatedAllergens);
    onAllergyChange(updatedAllergens);
  };

  return (
    <div className="flex flex-col max-w-[366px] w-[306px] h-auto items-start gap-3 p-4 bg-white rounded-2xl shadow-md">
      <div className="flex items-center gap-1">
        <h2 className="text-[16px] font-semibold text-black font-inter">
          ⚙️ 알러지 필터
        </h2>
      </div>
      <div className="flex flex-wrap gap-2 w-full">
        {allergens.map((allergen) => (
          <button
            key={allergen.id}
            onClick={() => toggleAllergen(allergen.id)}
            className={`
              flex items-center justify-start 
              min-w-[85px] h-[24px] px-[8px] py-1 
              rounded-[12px] text-[12px] font-medium 
              cursor-pointer transition-colors font-inter 
              bg-white text-black border
              ${
                allergen.selected
                  ? "border-ara_red_bright border-2 text-ara_red_dark" 
                  : "border-ara_gray_bright"
              }
            `}
          >
            {allergen.name}
          </button>
        ))}
      </div>
    </div>
  );
};

export default AllergyFilter;