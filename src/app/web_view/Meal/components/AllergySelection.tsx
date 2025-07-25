'use client';

import { useState } from 'react';

// 알레르기 목록 (id 제거)
const allergies = [
  '달걀', '우유', '메밀', '땅콩', '대두', 
  '밀', '고등어', '게', '새우', '돼지고기', 
  '복숭아', '토마토', '아황산', '호두', '닭고기', 
  '쇠고기', '오징어', '조개류', '잣'
];

// 체크 아이콘
const CheckIcon = () => (
  <div className="relative">
    <svg width="14" height="16" viewBox="0 0 14 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M5.13042 10.5833L3.10625 8.27C2.87875 8.01 2.51125 8.01 2.28375 8.27C2.05625 8.53 2.05625 8.95 2.28375 9.21L4.72209 11.9967C4.94959 12.2567 5.31709 12.2567 5.54459 11.9967L11.7163 4.94333C11.9438 4.68333 11.9438 4.26333 11.7163 4.00333C11.4888 3.74333 11.1213 3.74333 10.8938 4.00333L5.13042 10.5833Z" fill="white"/>
    </svg>
  </div>
);

// 빈 체크 아이콘
const EmptyCheckIcon = () => (
  <div className="w-5 h-5 rounded-full border border-gray-300"></div>
);

interface AllergySelectionProps {
  onSave?: (selectedAllergies: string[]) => void;
  onCancel?: () => void;
  defaultSelected?: string[];
}

export default function AllergySelection({ 
  onSave, 
  onCancel,
  defaultSelected = [] 
}: AllergySelectionProps) {
  const [selectedAllergies, setSelectedAllergies] = useState<string[]>(defaultSelected);

  // 알레르기 토글 핸들러
  const toggleAllergy = (name: string) => {
    setSelectedAllergies(prev => 
      prev.includes(name) 
        ? prev.filter(item => item !== name) 
        : [...prev, name]
    );
  };

  // 저장 핸들러
  const handleSave = () => {
    if (onSave) {
      onSave(selectedAllergies);
    }
  };

  // 취소 핸들러
  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
  };

  return (
    <div className="w-80 bg-white/95 rounded-xl shadow-md flex flex-col gap-y-[30px]">
      {/* 헤더 */}
      <div className="self-stretch pl-5 pr-7 pt-7 pb-1 flex justify-center items-center">
        <div className="text-black text-xl font-bold">알레르기 필터</div>
      </div>
      
      {/* 알레르기 목록 - 스크롤바 숨기고 스크롤 기능 유지 */}
      <div 
        className="self-stretch h-[459px] px-6 flex flex-col overflow-y-auto"
        style={{ 
          scrollbarWidth: 'none',  // Firefox
          msOverflowStyle: 'none'   // IE, Edge
        }}
      >
        <style jsx>{`
          div::-webkit-scrollbar {
            display: none;  /* Chrome, Safari */
          }
        `}</style>
        
        {allergies.map((allergy, index) => {
          const isSelected = selectedAllergies.includes(allergy);
          return (
            <div key={index}>
              <div 
                className={`self-stretch px-2.5 py-3 flex items-center gap-5 cursor-pointer ${
                  isSelected ? 'bg-rose-50' : ''
                }`}
                onClick={() => toggleAllergy(allergy)}
              >
                {isSelected ? (
                  <div className="w-5 h-5 bg-red-500 rounded-xl flex items-center justify-center">
                    <CheckIcon />
                  </div>
                ) : (
                  <EmptyCheckIcon />
                )}
                <div className="text-black text-base">{allergy}</div>
              </div>
              <div className="self-stretch h-0 border-t border-gray-200"></div>
            </div>
          );
        })}
      </div>
      
      {/* 하단 버튼 */}
      <div className="self-stretch flex">
        <button
          className="flex-1 py-4 border-t border-r border-gray-200 text-red-500 text-[16px]"
          onClick={handleCancel}
        >
          취소
        </button>
        <button
          className="flex-1 py-4 border-t border-l border-gray-200 text-red-500 text-[16px] font-bold"
          onClick={handleSave}
        >
          저장({selectedAllergies.length})
        </button>
      </div>
    </div>
  );
}