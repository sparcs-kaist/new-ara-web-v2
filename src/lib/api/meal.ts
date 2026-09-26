import http from '@/lib/api/http';
import httpNoRedicrect from '@/lib/api/httpNoRedirect';
import { queryBuilder } from '@/lib/utils/queryBuilder';
import type { Paginated } from '@/lib/types/delivery';
import { MealPhoto, MealResponse, Restaurant } from '@/lib/types/meal';

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

export const fetchRestaurants = async (): Promise<Restaurant[]> => {
  const { data } = await httpNoRedicrect.get<Restaurant[]>('meal/restaurants/');
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

export const uploadMealPhoto = async (body: {
  restaurant_id: number;
  date: MealDate;
  meal_time: MealType;
  image: File;
  comment?: string;
}) => {
  const form = new FormData();
  form.append('restaurant_id', String(body.restaurant_id));
  form.append('date', body.date);
  form.append('meal_time', body.meal_time);
  form.append('image', body.image);
  if (body.comment) form.append('comment', body.comment);
  const { data } = await http.post<MealPhoto>('meal/photos/', form);
  return data;
};

export const deleteMealPhoto = async (id: number): Promise<void> => {
  await http.delete(`meal/photos/${id}/`);
};