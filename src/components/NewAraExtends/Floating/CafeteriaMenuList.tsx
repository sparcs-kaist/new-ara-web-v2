// CafeteriaMenuList.tsx
import React from 'react';
import { Allergen } from './types';

interface CafeteriaMenuItem {
  menu_name: string;
  price: number;
  allergy: number[];
}

interface CafeteriaMenuListProps {
  menuData: CafeteriaMenuItem[] | null;
  selectedAllergies: Allergen[];
}

export default function CafeteriaMenuList({ 
  menuData,
  selectedAllergies 
}: CafeteriaMenuListProps) {
  
  // 메뉴 데이터가 없는 경우 처리
  if (!menuData || menuData.length === 0) {
    return (
      <div className="flex justify-center items-center h-40">
        <span className="text-gray-500">
          미운영
        </span>
      </div>
    );
  }

  // 선택된 알러지 ID 목록 생성
  const selectedAllergyIds = selectedAllergies
    .filter(allergy => allergy.selected)
    .map(allergy => allergy.id);

  const hasSelectedAllergy = (allergyList: number[]) => {
    return allergyList.some(id => selectedAllergyIds.includes(id));
  };

  // 메뉴 선택 상태 관리
  const [selectedItems, setSelectedItems] = React.useState<Set<number>>(new Set());

  // 메뉴 선택/해제 토글
  const toggleItem = (index: number) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedItems(newSelected);
  };

  // 선택된 메뉴들의 총 가격 계산
  const totalPrice = Array.from(selectedItems).reduce((sum, index) => {
    return sum + menuData[index].price;
  }, 0);

  return (
    <div className="flex flex-col gap-1 mt-6">
      {/* 메뉴 아이템 목록 */}
      <div className="flex flex-col">
        {menuData.map((item, index) => (
          <div 
            key={index} 
            onClick={() => toggleItem(index)}
            className={`
              flex items-center justify-between py-1 px-2
              cursor-pointer
              ${selectedItems.has(index) ? 'bg-[#FDF0F0]' : ''}
            `}
          >
            <div className="flex items-center gap-2">
              <span className={`
                font-medium text-xs
                ${hasSelectedAllergy(item.allergy) ? 'text-[#999999]' : 'text-black'}
              `}>
                {item.menu_name}
              </span>
              {hasSelectedAllergy(item.allergy) && (
                <img
                  src="/NewAraExtendIcons/exclamation.svg"
                  alt="Exclamation Icon"
                  className="w-4 h-4 text-[#c62626]"
                />
              )}
            </div>
            <span className="font-medium text-xs text-black">
              {item.price.toLocaleString()}원
            </span>
          </div>
        ))}
      </div>

      {/* 구분선 */}
      <div className="w-full h-px bg-gray-200" />

      {/* Total */}
      <div className="flex items-center justify-between">
        <span className="font-semibold text-[#c62626] text-[14px]">
          Total ({selectedItems.size}개 선택) :
        </span>
        <span className="font-semibold text-[#ed3a3a] text-[14px]">
          {totalPrice.toLocaleString()}원
        </span>
      </div>
    </div>
  );
}