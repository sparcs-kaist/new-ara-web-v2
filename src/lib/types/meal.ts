// 학식 API 타입 정의

// 개별 카페테리아 메뉴 아이템
export interface MenuItem {
  menu_name: string;
  price: number;
  allergy: number[];
}

// 코스 메뉴 아이템 (일품, 한식코너 등)
export interface CourseMenuItem {
  course_name: string;
  price: number;
  menu_list: Array<[string, number[]]>; // [메뉴 이름, 알레르기 ID 배열] 형태의 튜플
}

// 식당 기본 정보 인터페이스 (공통)
export interface RestaurantBase {
  name: string;
  type: string;
}

// 카페테리아 식당 정보
export interface CafeteriaRestaurant extends RestaurantBase {
  morning_menu: MenuItem[];
  lunch_menu: MenuItem[];
  dinner_menu: MenuItem[];
}

// 코스 식당 정보
export interface CourseRestaurant extends RestaurantBase {
  morning_menu: CourseMenuItem[];
  lunch_menu: CourseMenuItem[];
  dinner_menu: CourseMenuItem[];
}

// 전체 카페테리아 메뉴 응답
export interface CafeteriaMenuResponse {
  date: string;
  fclt: CafeteriaRestaurant;   // 카이마루
  west: CafeteriaRestaurant;   // 서맛골
  east1: CafeteriaRestaurant;  // 동맛골 1층
  east2: CafeteriaRestaurant;  // 동맛골 2층
  emp: CafeteriaRestaurant;    // 교수회관
}

// 전체 코스 메뉴 응답
export interface CourseMenuResponse {
  date: string;
  fclt: CourseRestaurant;    // 카이마루
  west: CourseRestaurant;    // 서맛골
  east1: CourseRestaurant;   // 동맛골 1층
  east2: CourseRestaurant;   // 동맛골 2층
  emp: CourseRestaurant;     // 교수회관
}

// 각 식사 시간대 (편의를 위해 enum 추가)
export enum MealTime {
  MORNING = 'morning',
  LUNCH = 'lunch',
  DINNER = 'dinner'
}

// 특정 시간대의 메뉴 접근을 위한 헬퍼 타입
export type MealTimeKey = `${MealTime}_menu`;

// 식당 ID 타입 (식당 식별자)
export type RestaurantId = 'fclt' | 'west' | 'east1' | 'east2' | 'emp';

// 식당 ID와 이름 매핑
export const RESTAURANT_NAMES: Record<RestaurantId, string> = {
  fclt: '카이마루',
  west: '서맛골',
  east1: '동맛골 1층',
  east2: '동맛골 2층',
  emp: '교수회관'
};

// 식당 ID와 UI 표시 이름 매핑 (코드에서 사용하는 이름과 UI에 표시될 이름)
export const RESTAURANT_DISPLAY_NAMES: Record<RestaurantId, string> = {
  fclt: '카이마루',
  west: '서맛골',
  east1: '동맛골 1층 (일품)',
  east2: '동맛골 2층 (동측 교직원식당)',
  emp: '교수회관'
} as const;

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