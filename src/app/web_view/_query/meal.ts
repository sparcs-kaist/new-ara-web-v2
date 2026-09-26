'use client';

import { useQueries } from '@tanstack/react-query';
import { fetchMealPhotos } from '@/lib/api/meal';
import { RESTAURANT_IDS, type MealType } from '@/lib/types/meal';

export const MEAL_PHOTOS_KEY = ['webview', 'meal', 'photos'] as const;

// The API takes one restaurant per call; results follow RESTAURANT_IDS order.
export function useMealPhotos(date: string | null, mealTime: MealType) {
    return useQueries({
        queries: RESTAURANT_IDS.map((restaurantId) => ({
            queryKey: [...MEAL_PHOTOS_KEY, restaurantId, date, mealTime],
            queryFn: () =>
                fetchMealPhotos({ restaurant_id: restaurantId, date: date as string, meal_time: mealTime, page_size: 30 }),
            enabled: date !== null,
            staleTime: 30_000,
            refetchOnMount: true,
        })),
    });
}
