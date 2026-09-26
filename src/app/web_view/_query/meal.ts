'use client';

import { useQueries, useQuery } from '@tanstack/react-query';
import { fetchMealPhotos, fetchRestaurants } from '@/lib/api/meal';
import { displayRestaurantName, FALLBACK_RESTAURANTS, type MealType, type Restaurant } from '@/lib/types/meal';

export const MEAL_PHOTOS_KEY = ['webview', 'meal', 'photos'] as const;

export function useRestaurants(): Restaurant[] {
    const { data } = useQuery({
        queryKey: ['webview', 'meal', 'restaurants'],
        queryFn: fetchRestaurants,
        select: (list) => list.filter((r) => r.is_active),
        staleTime: 60 * 60_000,
        gcTime: 24 * 60 * 60_000,
    });
    return data?.length ? data : FALLBACK_RESTAURANTS;
}

// Photos carry only the school's name, so the display name comes from the restaurants list.
export function useRestaurantName() {
    const restaurants = useRestaurants();
    return (restaurant: { id: number; name: string }) => {
        const listed = restaurants.find((r) => r.id === restaurant.id);
        return listed ? displayRestaurantName(listed) : restaurant.name;
    };
}

// The API takes one restaurant per call; results follow the restaurants' order.
export function useMealPhotos(restaurants: Restaurant[], date: string | null, mealTime: MealType) {
    return useQueries({
        queries: restaurants.map(({ id }) => ({
            queryKey: [...MEAL_PHOTOS_KEY, id, date, mealTime],
            queryFn: () => fetchMealPhotos({ restaurant_id: id, date: date as string, meal_time: mealTime, page_size: 30 }),
            enabled: date !== null,
            staleTime: 30_000,
            refetchOnMount: true,
        })),
    });
}
