// Rollout gate for the 식사 tab: everyone outside production, a fixed group in production.
// Environment comes from NEXT_PUBLIC_APP_ENV (NODE_ENV is 'production' on the dev deploy too).
const ROLLOUT_USER_IDS = [96963];
const isProd = process.env.NEXT_PUBLIC_APP_ENV === 'production';

export const canUseMeal = (me: { user?: number; id?: number } | undefined) =>
    !isProd || ROLLOUT_USER_IDS.includes((me?.user ?? me?.id) as number);
