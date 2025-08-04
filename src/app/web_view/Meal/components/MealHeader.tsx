'use client';

import { ReactNode, useState } from 'react';
import AllergySelection from '@/app/web_view/Meal/components/AllergySelection';

// 뒤로가기 아이콘 컴포넌트
const BackIcon = () => (
  <svg width="35" height="36" viewBox="0 0 35 36" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g clipPath="url(#clip0_4551_445)">
      <path 
        fillRule="evenodd" 
        clipRule="evenodd" 
        d="M10.4039 18.6759C10.2611 18.2366 10.2611 17.7634 10.4039 17.3241C10.5068 17.0071 10.6814 16.7645 10.8437 16.5732C10.9915 16.3991 11.1816 16.209 11.3769 16.0139L20.0079 7.38285C20.435 6.95572 21.1275 6.95572 21.5547 7.38285C21.9818 7.80999 21.9818 8.50251 21.5547 8.92965L12.9484 17.5359C12.719 17.7653 12.5941 17.8914 12.5113 17.989C12.508 17.9928 12.505 17.9965 12.502 18C12.505 18.0035 12.508 18.0072 12.5113 18.011C12.5941 18.1086 12.719 18.2347 12.9484 18.4641L21.5547 27.0704C21.9818 27.4975 21.9818 28.19 21.5547 28.6171C21.1275 29.0443 20.435 29.0443 20.0079 28.6171L11.4016 20.0109C11.3933 20.0025 11.3851 19.9943 11.3769 19.9861C11.1816 19.791 10.9915 19.6009 10.8437 19.4268C10.6814 19.2355 10.5068 18.9928 10.4039 18.6759Z" 
        fill="#ED3A3A"
      />
    </g>
    <defs>
      <clipPath id="clip0_4551_445">
        <rect width="35" height="35" fill="white" transform="translate(0 0.5)"/>
      </clipPath>
    </defs>
  </svg>
);

// 알레르기 필터 아이콘 컴포넌트 - 선택 여부에 따라 다른 아이콘 표시
const AllergyFilterIcon = ({ hasSelections = false }: { hasSelections?: boolean }) => (
  hasSelections ? (
    // 필터 선택이 있을 때의 아이콘
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g clipPath="url(#clip0_4551_452)">
        <path 
          d="M11.505 8.36003L11.155 4.84003H16.155V0.840027H18.155V4.84003H23.155L21.775 18.63L11.505 8.36003ZM1.155 20.84V21.84C1.155 22.39 1.605 22.84 2.155 22.84H15.155C15.705 22.84 16.155 22.39 16.155 21.84V20.84H1.155ZM22.055 21.74L2.255 1.94003L0.845001 3.35003L6.545 9.05003C3.435 9.71003 1.155 11.83 1.155 14.84H12.325L14.325 16.84H1.155V18.84H16.155V18.67L20.645 23.16L22.055 21.74Z" 
          fill="#ED3A3A"
        />
      </g>
      <defs>
        <clipPath id="clip0_4551_452">
          <rect width="24" height="24" fill="white"/>
        </clipPath>
      </defs>
    </svg>
  ) : (
    // 필터 선택이 없을 때의 아이콘
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g clipPath="url(#clip0_4551_402)">
        <path d="M1.16 20.845H16.17V21.825C16.17 22.385 15.72 22.835 15.16 22.835H2.17C1.61 22.835 1.16 22.385 1.16 21.825V20.845ZM20.65 23.155L16.16 18.675V18.845H1.16V16.845H14.33L12.33 14.845H1.16C1.16 11.605 3.62 9.67497 6.54 9.05497L0.839996 3.35497L2.26 1.94497L22.06 21.745L20.65 23.155ZM10.33 12.845L8.33 10.845C6.91 10.905 4.81 11.405 3.78 12.845H10.33ZM23.16 4.84497H18.16V0.844971H16.16V4.84497H11.16L11.39 6.84497H20.95L19.95 16.815L21.78 18.645L23.16 4.84497Z" fill="#ED3A3A"/>
      </g>
      <defs>
        <clipPath id="clip0_4551_402">
          <rect width="24" height="24" fill="white"/>
        </clipPath>
      </defs>
    </svg>
  )
);

// 알림 뱃지 컴포넌트
const NotificationBadge = ({ count }: { count: number }) => (
  count > 0 ? (
    <div className="w-3 h-3 bg-red-500 rounded-xl outline outline-2 outline-white flex justify-center items-center">
      <span className="text-white text-[8px] font-semibold">{count}</span>
    </div>
  ) : null
);

interface MealHeaderProps {
  title?: string;
  onBackClick?: () => void;
  backLabel?: string;
  children?: ReactNode;
  
  // 알레르기 관련 props
  selectedAllergies?: string[];
  onAllergyChange?: (allergies: string[]) => void;
}

export default function MealHeader({
  title = "오늘의 학식",
  onBackClick,
  backLabel = "홈",
  children,
  onAllergyChange
}: MealHeaderProps) {
  // 알레르기 선택 모달 표시 여부 상태
  const [showAllergySelection, setShowAllergySelection] = useState(false);

  // 알레르기 선택 상태를 컴포넌트 내부에서 관리
  const [selectedAllergies, setSelectedAllergies] = useState<string[]>([]);

  // 알레르기 필터 아이콘 클릭 핸들러
  const handleAllergyFilterClick = () => {
    setShowAllergySelection(true);
  };

  // 알레르기 선택 저장 핸들러
  const handleAllergySave = (allergies: string[]) => {
    setSelectedAllergies(allergies);
    setShowAllergySelection(false);
    if (onAllergyChange) {
      onAllergyChange(allergies);
    }
  };

  // 알레르기 선택 취소 핸들러
  const handleAllergyCancel = () => {
    setShowAllergySelection(false);
  };

  return (
    <>
      <div className="flex justify-between items-center h-12 w-full">
        {/* 뒤로가기 버튼 */}
        <div className="flex items-center cursor-pointer" onClick={onBackClick}>
          <BackIcon />
          <span className="text-red-500 text-base font-medium">{backLabel}</span>
        </div>
        
        {/* 타이틀 */}
        <h1 className="text-red-500 text-lg font-bold">{title}</h1>
        
        {/* 알레르기 필터 버튼 */}
        <div 
          className="p-2.5 flex items-center relative cursor-pointer" 
          onClick={handleAllergyFilterClick}
        >
          <AllergyFilterIcon hasSelections={selectedAllergies.length > 0} />
          <div className="absolute right-[12px] bottom-[10px]">
            <NotificationBadge count={selectedAllergies.length} />
          </div>
        </div>
        
        {/* 추가 컨텐츠가 있으면 렌더링 */}
        {children}
      </div>

      {/* 알레르기 선택 모달 */}
      {showAllergySelection && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <AllergySelection 
            defaultSelected={selectedAllergies}
            onSave={handleAllergySave}
            onCancel={handleAllergyCancel}
          />
        </div>
      )}
    </>
  );
}