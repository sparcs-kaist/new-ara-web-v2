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
      <h2 className="text-[14px] font-semibold text-black font-inter">
        알러지 필터
      </h2>
      <div className="flex flex-wrap gap-2 w-full">
        {allergens.map((allergen) => (
          <button
            key={allergen.id}
            onClick={() => toggleAllergen(allergen.id)}
            className={`
              flex items-center justify-start 
              min-w-[85px] h-[24px] px-[8px] py-1 
              rounded-[12px] text-[12px] font-semibold 
              cursor-pointer transition-colors font-inter 
              ${
                allergen.selected
                  ? "bg-[#ed3a3a] text-white"
                  : "bg-white text-[#c62626] border border-[#c62626]"
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