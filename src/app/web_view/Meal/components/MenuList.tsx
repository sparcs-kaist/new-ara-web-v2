'use client';

import { useState } from 'react';

// 타입 정의
interface Allergen {
  id: number;
  name: string;
  selected: boolean;
}

// 코스 메뉴 타입
interface CourseMenu {
  course_name: string;
  price: number;
  menu_list: [string, number[]][];  // [메뉴 이름, 알레르기 ID 배열]
}

// 카페테리아 메뉴 타입
interface CafeteriaMenuItem {
  menu_name: string;
  price: number;
  allergy: number[];
}

// 알레르기 경고 아이콘 컴포넌트
const AllergyWarningIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 0C3.584 0 0 3.584 0 8C0 12.416 3.584 16 8 16C12.416 16 16 12.416 16 8C16 3.584 12.416 0 8 0ZM8 12C7.56 12 7.2 11.64 7.2 11.2C7.2 10.76 7.56 10.4 8 10.4C8.44 10.4 8.8 10.76 8.8 11.2C8.8 11.64 8.44 12 8 12ZM8.8 8.32C8.8 8.76 8.44 9.12 8 9.12C7.56 9.12 7.2 8.76 7.2 8.32V4.8C7.2 4.36 7.56 4 8 4C8.44 4 8.8 4.36 8.8 4.8V8.32Z" fill="#C62626"/>
  </svg>
);

// 속성 타입
interface MenuListProps {
  menuType: 'course' | 'cafeteria';
  menuData: CourseMenu[] | CafeteriaMenuItem[] | null;
  selectedAllergies: string[];  // 알레르기 ID 배열 (알레르기 이름으로 변경)
  allergenMap?: Record<string, number>;  // 알레르기 이름-ID 매핑
}

// 알레르기 ID 매핑
const defaultAllergenMap: Record<string, number> = {
  '달걀': 1, '우유': 2, '메밀': 3, '땅콩': 4, '대두': 5, 
  '밀': 6, '고등어': 7, '게': 8, '새우': 9, '돼지고기': 10,
  '복숭아': 11, '토마토': 12, '아황산': 13, '호두': 14, '닭고기': 15,
  '쇠고기': 16, '오징어': 17, '조개류': 18, '잣': 19
};

export default function MenuList({
  menuType,
  menuData,
  selectedAllergies,
  allergenMap = defaultAllergenMap
}: MenuListProps) {
  // 카페테리아 메뉴에서 선택된 항목 관리
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());

  // 메뉴 데이터가 없는 경우 처리
  if (!menuData || (Array.isArray(menuData) && menuData.length === 0)) {
    return (
      <div className="flex justify-center items-center h-40">
        <span className="text-gray-500">
          미운영
        </span>
      </div>
    );
  }

  // 선택된 알레르기 ID 목록 생성
  const selectedAllergyIds = selectedAllergies.map(name => allergenMap[name]).filter(Boolean);

  // 알레르기 포함 여부 확인
  const hasSelectedAllergy = (allergyList: number[]) => {
    return allergyList.some(id => selectedAllergyIds.includes(id));
  };

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

  // 코스 메뉴 렌더링
  if (menuType === 'course') {
    const courseMenus = menuData as CourseMenu[];
    
    return (
      <div className="flex flex-col gap-[12px] mt-3">
        {courseMenus.map((course, courseIndex) => (
          <div key={courseIndex} className="flex flex-col gap-1">
            {/* 코스 이름과 가격 */}
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-[#c62626] text-[14px]">
                {course.course_name}
              </h3>
              <span className="font-semibold text-[#ed3a3a] text-[12px]">
                {course.price.toLocaleString()}원
              </span>
            </div>

            {/* 구분선 */}
            <div className="w-full h-px bg-gray-200" />

            {/* 메뉴 목록 */}
            <div className="flex flex-col gap-1">
              {course.menu_list.map(([name, allergies], index) => (
                <div 
                  key={index} 
                  className="flex items-center gap-1"
                >
                  <span className={`
                    font-medium text-xs
                    ${hasSelectedAllergy(allergies) ? 'text-[#999999]' : 'text-black'}
                  `}>
                    {name}
                  </span>
                  {hasSelectedAllergy(allergies) && <AllergyWarningIcon />}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }
  
  // 카페테리아 메뉴 렌더링
  else {
    const cafeteriaMenus = menuData as CafeteriaMenuItem[];
    
    // 선택된 메뉴들의 총 가격 계산
    const totalPrice = Array.from(selectedItems).reduce((sum, index) => {
      return sum + cafeteriaMenus[index].price;
    }, 0);

    return (
      <div className="flex flex-col gap-1 mt-6">
        {/* 메뉴 아이템 목록 */}
        <div className="flex flex-col">
          {cafeteriaMenus.map((item, index) => (
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
                {hasSelectedAllergy(item.allergy) && <AllergyWarningIcon />}
              </div>
              <span className="font-medium text-xs text-black">
                {item.price.toLocaleString()}원
              </span>
            </div>
          ))}
        </div>

        {/* 구분선 */}
        <div className="w-full h-px bg-gray-200 my-1" />

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
}