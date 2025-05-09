import React, { useState } from "react";

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

const initialAllergens: Allergen[] = [
  { id: 1, name: "1: 달걀", selected: false },
  { id: 2, name: "2: 우유", selected: false },
  { id: 3, name: "3: 메밀", selected: false },
  { id: 4, name: "4: 땅콩", selected: false },
  { id: 5, name: "5: 대두", selected: false },
  { id: 6, name: "6: 밀", selected: false },
  { id: 7, name: "7: 고등어", selected: false },
  { id: 8, name: "8: 게", selected: false },
  { id: 9, name: "9: 새우", selected: false },
  { id: 10, name: "10: 돼지고기", selected: false },
  { id: 11, name: "11: 복숭아", selected: false },
  { id: 12, name: "12: 토마토", selected: false },
  { id: 13, name: "13: 아황산", selected: false },
  { id: 14, name: "14: 호두", selected: false },
  { id: 15, name: "15: 닭고기", selected: false },
  { id: 16, name: "16: 쇠고기", selected: false },
  { id: 17, name: "17: 오징어", selected: false },
  { id: 18, name: "18: 조개류", selected: false },
  { id: 19, name: "19: 잣", selected: false },
];

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