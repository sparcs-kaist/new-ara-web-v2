// Rollout gate for the 식사 tab: one user for now; move to a /me feature flag when the list grows.
const MEAL_USER_IDS = [96963];

export const canUseMeal = (me: { user?: number; id?: number } | undefined) =>
    MEAL_USER_IDS.includes((me?.user ?? me?.id) as number);
