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

export interface Restaurant {
  id: number;
  code: string | null;
  name: string;
  display_name: string;
  is_active: boolean;
}

// 목록을 불러오는 중이거나 실패했을 때만 쓴다
export const FALLBACK_RESTAURANTS: Restaurant[] = [
  { id: 1, code: 'fclt', name: '카이마루', display_name: '카이마루', is_active: true },
  { id: 2, code: 'west', name: '서맛골', display_name: '서맛골', is_active: true },
  { id: 3, code: 'east1', name: '동맛골(동측학생식당)', display_name: '동맛골 1층 (학생식당)', is_active: true },
  { id: 4, code: 'east2', name: '동맛골(동측 교직원식당)', display_name: '동맛골 2층 (교직원식당)', is_active: true },
  { id: 5, code: 'emp', name: '교수회관', display_name: '교수회관', is_active: true },
];

// 서버 display_name보다 앞선다: 크롤러가 display_name을 채우기 전에도 확정된 이름이 보이게
const RESTAURANT_NAME_OVERRIDES: Record<string, string> = {
  east1: '동맛골 1층 (학생식당)',
  east2: '동맛골 2층 (교직원식당)',
};

export function displayRestaurantName(restaurant: Restaurant): string {
  return (restaurant.code && RESTAURANT_NAME_OVERRIDES[restaurant.code]) || restaurant.display_name || restaurant.name;
}

export function defaultRestaurant(restaurants: Restaurant[]): Restaurant {
  return restaurants.find((r) => r.code === 'fclt') ?? restaurants[0];
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

// The meal API has no serving hours; 아침/저녁 are placeholders until confirmed.
export const MEAL_SLOTS = [
  { time: '아침', hours: '08:00–09:30', endMinute: 9 * 60 + 30 },
  { time: '점심', hours: '11:30–14:00', endMinute: 14 * 60 },
  { time: '저녁', hours: '17:30–19:30', endMinute: 19 * 60 + 30 },
] as const;

export type MealSlot = (typeof MEAL_SLOTS)[number];

export function currentMealSlot(date: Date = new Date()): MealSlot {
  const minute = date.getHours() * 60 + date.getMinutes();
  return MEAL_SLOTS.find((slot) => minute < slot.endMinute) ?? MEAL_SLOTS[MEAL_SLOTS.length - 1];
}

// Local date, not toISOString(): the meal APIs key days by the KST calendar.
export function formatMealDate(date: Date = new Date()): string {
  return `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
}

export interface MealPhoto {
  id: number;
  restaurant: { id: number; name: string };
  date: string;
  meal_time: MealType;
  image: string;
  comment: string;
  is_official: boolean;
  source: 'USER' | 'INSTAGRAM';
  author: { nickname: string } | null;
  is_mine: boolean;
  created_at: string;
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