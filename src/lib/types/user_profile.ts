/* eslint-disable */

// 본인이 아닌 다른 User Profile 조회시 Response Type
export type GeneralUserProfile = {
  user: number; // user id
  nickname: string;
  picture: string;
  is_official: boolean;
  is_school_admin: boolean;
}

// 본인 User Profile 조회시 Response Type
