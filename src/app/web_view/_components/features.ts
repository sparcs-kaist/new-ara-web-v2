// Rollout gate for the 식사 and 내 게시판 tabs: everyone outside production, a fixed group in production.
// Environment comes from NEXT_PUBLIC_APP_ENV (NODE_ENV is 'production' on the dev deploy too).
const ROLLOUT_USER_IDS = [96963, 101825, 96895, 101996, 94742, 96914, 96628, 101292, 102149];
const isProd = process.env.NEXT_PUBLIC_APP_ENV === 'production';

export const canUseMeal = (me: { user?: number; id?: number } | undefined) =>
    !isProd || ROLLOUT_USER_IDS.includes((me?.user ?? me?.id) as number);

export const canUseCampus = canUseMeal;

export const isRolloutUser = (me: { user?: number; id?: number } | undefined) =>
    ROLLOUT_USER_IDS.includes((me?.user ?? me?.id) as number);
