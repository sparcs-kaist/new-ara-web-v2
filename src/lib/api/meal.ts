import http from '@/lib/api/http';
import httpNoRedicrect from '@/lib/api/httpNoRedirect';
import { queryBuilder } from '@/lib/utils/queryBuilder';
import type { Paginated } from '@/lib/types/delivery';
import { MealPhoto, MealResponse } from '@/lib/types/meal';

type MealDate = string; // "YYYYMMDD" 형태 문자열 (ex: 20251128)
export type MealType = 'BREAKFAST' | 'LUNCH' | 'DINNER';

export const fetchMeal = async (
  date: MealDate,
  restaurantId: number,
  mealType: MealType,
  allergyCodes?: string
): Promise<MealResponse> => {
  const params = new URLSearchParams({
    date,
    restaurant_id: restaurantId.toString(),
    meal_time: mealType,
  });

  if (allergyCodes) {
    params.append('allergy_codes', allergyCodes);
  }

  const { data } = await httpNoRedicrect.get<MealResponse>(
    `meal/?${params.toString()}`
  );

  return data;
};

export const fetchMealPhotos = async (params: {
  restaurant_id: number;
  date: MealDate;
  meal_time?: MealType;
  page_size?: number;
}) => {
  const { data } = await http.get<Paginated<MealPhoto>>(`meal/photos/?${queryBuilder(params)}`);
  return data;
};