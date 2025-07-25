'use client';

import { useState, useRef, useEffect } from 'react';
import { 
  CourseMenuItem, 
  MenuItem, 
  ALLERGEN_MAP 
} from '@/lib/types/meal';

// 알레르기 경고 아이콘 컴포넌트
interface AllergyWarningIconProps {
  allergyIds: number[];
}

const AllergyWarningIcon = ({ allergyIds }: AllergyWarningIconProps) => {
  const [showPopover, setShowPopover] = useState(false);
  const iconRef = useRef<HTMLDivElement>(null);
  
  // 다른 곳 클릭 시 팝오버 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (iconRef.current && !iconRef.current.contains(event.target as Node)) {
        setShowPopover(false);
      }
    };
    
    if (showPopover) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showPopover]);
  
  // 알레르기 ID를 이름으로 변환
  const allergyNames = allergyIds.map(id => ALLERGEN_MAP[id]).filter(Boolean);
  
  return (
    <div ref={iconRef} className="relative cursor-pointer" onClick={(e) => {
      e.stopPropagation(); // 부모 요소의 클릭 이벤트 전파 방지
      setShowPopover(!showPopover);
    }}>
      <svg width="16" height="17" viewBox="0 0 16 17" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M2.98 13.9954H13.02C14.0467 13.9954 14.6867 12.8821 14.1733 11.9954L9.15333 3.3221C8.64 2.43544 7.36 2.43544 6.84667 3.3221L1.82667 11.9954C1.31333 12.8821 1.95333 13.9954 2.98 13.9954ZM8 9.32877C7.63333 9.32877 7.33333 9.02877 7.33333 8.66211V7.32877C7.33333 6.9621 7.63333 6.6621 8 6.6621C8.36667 6.6621 8.66667 6.9621 8.66667 7.32877V8.66211C8.66667 9.02877 8.36667 9.32877 8 9.32877ZM8.66667 11.9954H7.33333V10.6621H8.66667V11.9954Z" fill="#D50000"/>
      </svg>
      
      {showPopover && (
        <div className="absolute z-10 left-0 -top-2 transform -translate-y-full bg-white shadow-md rounded-md p-2 min-w-[200px]">
          <div className="text-sm font-medium text-[#D50000] mb-1">알레르기 유발 물질</div>
          <ul className="text-xs">
            {allergyNames.length > 0 ? (
              allergyNames.map((name, idx) => (
                <li key={idx} className="py-1">{name}</li>
              ))
            ) : (
              <li className="py-1">알레르기 정보가 없습니다</li>
            )}
          </ul>
          <div className="absolute bottom-[-6px] left-2 w-2 h-2 bg-white transform rotate-45"></div>
        </div>
      )}
    </div>
  );
};

// 속성 타입
interface MenuListProps {
  menuType: 'course' | 'cafeteria';
  menuData: CourseMenuItem[] | MenuItem[] | null;
  selectedAllergies: string[];  // 알레르기 이름 배열
}

// 알레르기 이름-ID 매핑 반전 (ID → 이름을 이름 → ID로)
const generateAllergenNameMap = (): Record<string, number> => {
  const map: Record<string, number> = {};
  Object.entries(ALLERGEN_MAP).forEach(([id, name]) => {
    map[name] = parseInt(id);
  });
  return map;
};

const ALLERGEN_NAME_MAP = generateAllergenNameMap();

export default function MenuList({
  menuType,
  menuData,
  selectedAllergies
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
  const selectedAllergyIds = selectedAllergies.map(name => ALLERGEN_NAME_MAP[name]).filter(Boolean);

  // 알레르기 포함 여부 확인
  const hasSelectedAllergy = (allergyList: number[]) => {
    if (!allergyList || !Array.isArray(allergyList)) return false;
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
    const courseMenus = menuData as CourseMenuItem[];
    
    return (
      <div className="flex flex-col gap-[12px] w-full p-[15px] rounded-[15px] border border-[#F0F0F0]">
        {courseMenus.map((course, courseIndex) => (
          <div key={courseIndex} className="flex flex-col gap-1">
            {/* 코스 이름과 가격 */}
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-[#c62626] text-[16px]">
                {course.course_name}
              </h3>
              <span className="font-bold text-[#ed3a3a] text-[14px]">
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
                  {hasSelectedAllergy(allergies) && <AllergyWarningIcon allergyIds={allergies} />}
                  <span className={`
                    font-normal text-[16px]
                    ${hasSelectedAllergy(allergies) ? 'text-[#D50000]' : 'text-black'}
                  `}>
                    {name}
                  </span>
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
    const cafeteriaMenus = menuData as MenuItem[];
    
    // 선택된 메뉴들의 총 가격 계산
    const totalPrice = Array.from(selectedItems).reduce((sum, index) => {
      if (index < cafeteriaMenus.length) {
        return sum + cafeteriaMenus[index].price;
      }
      return sum;
    }, 0);

    return (
      <div className="flex flex-col gap-1 mt-6 w-full">
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
                {hasSelectedAllergy(item.allergy) && 
                  <AllergyWarningIcon allergyIds={item.allergy} />
                }
                <span className={`
                  font-medium text-xs
                  ${hasSelectedAllergy(item.allergy) ? 'text-[#999999]' : 'text-black'}
                `}>
                  {item.menu_name}
                </span>
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