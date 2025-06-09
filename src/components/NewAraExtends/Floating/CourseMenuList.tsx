// CourseMenuList.tsx
import React from 'react';
import { Allergen, CourseMenu } from './types';

interface CourseMenuListProps {
  menuData: CourseMenu[] | null;
  selectedAllergies: Allergen[];
}

export default function CourseMenuList({ 
  menuData,
  selectedAllergies 
}: CourseMenuListProps) {
  
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

  return (
    <div className="flex flex-col gap-[12px] mt-3">
      {/* 여러 코스 메뉴를 순회하며 표시 */}
      {menuData.map((course, courseIndex) => (
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
                {hasSelectedAllergy(allergies) && (
                  <img
                    src="/NewAraExtendIcons/exclamation.svg"
                    alt="Exclamation Icon"
                    className="w-4 h-4 text-[#c62626]"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}