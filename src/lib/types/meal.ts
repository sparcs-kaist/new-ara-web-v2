// 학식 API v2 타입 정의

// 개별 메뉴 아이템 (카페테리아 및 코스 메뉴 내부에서 사용)
export interface Menu {
  menu_name: string;
  allergy_codes: number[];
  has_user_allergy: boolean;
}

// 카페테리아 메뉴 아이템 (가격 포함)
export interface CafeteriaMenu {
  menu_name: string;
  price: number;
  allergy_codes: number[];
  has_user_allergy: boolean;
}

// 코스 메뉴 아이템 (일품코너 등)
export interface Course {
  course_name: string;
  price: number;
  menus: Menu[];
}

// API 응답 타입
export interface MealResponse {
  restaurant_id: number;
  courses: Course[];
  cafeteria_menus: CafeteriaMenu[];
}

// 식사 시간대 타입
export type MealType = 'BREAKFAST' | 'LUNCH' | 'DINNER';

// 각 식사 시간대 (편의를 위해 enum 추가)
export enum MealTime {
  MORNING = 'morning',
  LUNCH = 'lunch',
  DINNER = 'dinner'
}

// 특정 시간대의 메뉴 접근을 위한 헬퍼 타입
export type MealTimeKey = `${MealTime}_menu`;

// 식당 ID 타입 (API에서 사용하는 숫자 ID)
export type RestaurantId = 1 | 2 | 3 | 4 | 5;

// 식당 ID와 이름 매핑
export const RESTAURANT_NAMES: Record<RestaurantId, string> = {
  1: '카이마루',
  2: '서맛골',
  3: '동맛골 1층',
  4: '동맛골 2층',
  5: '교수회관'
};

// UI에서 사용하는 식당 표시 이름 배열
export const RESTAURANT_DISPLAY_NAMES_ARRAY = [
  '카이마루',
  '동맛골 1층 (일품)',
  '동맛골 1층 (카페테리아)',
  '동맛골 2층 (동측 교직원식당)',
  '서맛골',
  '교수회관'
];

// 식당 표시 이름을 ID로 변환하는 함수
export function getRestaurantIdFromDisplayName(displayName: string): RestaurantId {
  switch (displayName) {
    case '카이마루':
      return 1;
    case '서맛골':
      return 2;
    case '동맛골 1층 (일품)':
    case '동맛골 1층 (카페테리아)':
      return 3; // 둘 다 같은 API ID 사용
    case '동맛골 2층 (동측 교직원식당)':
      return 4;
    case '교수회관':
      return 5;
    default:
      return 1;
  }
}

// 식당 이름으로 메뉴 타입 결정 (course or cafeteria)
export function getMenuTypeFromRestaurantName(displayName: string): 'course' | 'cafeteria' {
  // 카페테리아가 이름에 포함되어 있으면 cafeteria
  if (displayName.includes('카페테리아')) {
    return 'cafeteria';
  }
  return 'course';
}

// MealTime enum을 API의 MealType으로 변환
export function mealTimeToMealType(mealTime: MealTime): MealType {
  switch (mealTime) {
    case MealTime.MORNING:
      return 'BREAKFAST';
    case MealTime.LUNCH:
      return 'LUNCH';
    case MealTime.DINNER:
      return 'DINNER';
    default:
      return 'LUNCH';
  }
}

// UI 시간 문자열을 MealType으로 변환
export function timeStringToMealType(timeString: string): MealType {
  const lowerTime = timeString.toLowerCase();
  if (lowerTime === '아침') return 'BREAKFAST';
  if (lowerTime === '점심') return 'LUNCH';
  if (lowerTime === '저녁') return 'DINNER';
  return 'LUNCH';
}

// 알레르기 정보 (API에서 사용하는 ID와 이름 매핑)
export const ALLERGEN_MAP: Record<number, string> = {
  1: '달걀',
  2: '우유',
  3: '메밀',
  4: '땅콩',
  5: '대두',
  6: '밀',
  7: '고등어',
  8: '게',
  9: '새우',
  10: '돼지고기',
  11: '복숭아',
  12: '토마토',
  13: '아황산',
  14: '호두',
  15: '닭고기',
  16: '쇠고기',
  17: '오징어',
  18: '조개류',
  19: '잣'
};