import http from "@/lib/api/http";
import { queryBuilder } from "../utils/queryBuilder";
import { queryClient } from "../queryClient";

// fetchMe : 로그인 유저 정보
export const fetchMe = async () => {
  const { data } = await http.get("/me");
  return data;
};

// fetchUser, updateUser : 유저 프로필 조회/수정
export const fetchUser = async (userId: number | string) => {
  const { data } = await http.get(`/user_profiles/${userId}/`);
  return data;
};

interface UpdateUserParams {
  nickname: string;
  picture?: File | null;
  sexual: boolean;
  social: boolean;
}

export const updateUser = async (
  userId: number | string,
  { nickname, picture, sexual, social }: UpdateUserParams,
) => {
  const formData = new FormData();
  formData.append("nickname", nickname);
  formData.append("see_sexual", String(sexual));
  formData.append("see_social", String(social));

  if (picture instanceof File) {
    formData.append("picture", picture);
  }

  const { data } = await http.patch(`/user_profiles/${userId}/`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  queryClient.invalidateQueries({ queryKey: ["me"] });
  return data;
};

// blockUser, unblockUser : 유저 차단/차단 해제
export const blockUser = async (userId: number | string) => {
  const { data } = await http.post("/blocks/", { user: userId });
  //@Todo : API call layer와 caching layer 분리하기
  queryClient.invalidateQueries({ queryKey: ["blockList"] });
  return data;
};

export const unblockUser = async (userId: number | string) => {
  const { data } = await http.post("/blocks/without_id/", { blocked: userId });
  //@Todo : API call layer와 caching layer 분리하기
  queryClient.invalidateQueries({ queryKey: ["blockList"] });
  return data;
};

// fetchBlocks, deleteBlock : 차단 목록
export const fetchBlocks = async () => {
  const { data } = await http.get("/blocks/");
  return data;
};

export const deleteBlock = async (blockId: number | string) => {
  const { data } = await http.delete(`/blocks/${blockId}/`);
  //@Todo : API call layer와 caching layer 분리하기
  queryClient.invalidateQueries({ queryKey: ["blockList"] });
  return data;
};

// updateDarkMode : 다크 모드 설정
export const updateDarkMode = async (
  userId: number | string,
  darkMode: boolean,
) => {
  const { data } = await http.patch(`/user_profiles/${userId}/`, {
    extra_preferences: {
      darkMode,
    },
  });

  queryClient.invalidateQueries({ queryKey: ["me"] });
  return data;
};

// updateTos : 이용 약관 동의 여부 설정
export const updateTos = async (userId: number | string) => {
  const { data } = await http.patch(
    `/user_profiles/${userId}/agree_terms_of_service/`,
  );
  queryClient.invalidateQueries({ queryKey: ["me"] });
  return data;
};

// logout : 로그아웃
export const logout = async (userId: number | string) => {
  await queryClient.cancelQueries({ queryKey: ["me"] });
  const { data } = await http.delete(`/users/${userId}/sso_logout/`);
  queryClient.removeQueries({ queryKey: ["me"] });
  return data;
};

// updateFCMToken , deleteFCMToken : FCM 토큰 관리
export const updateFCMToken = async (token: string) => {
  const { data } = await http.patch("/fcm_token/update", { token });
  return data;
};

export const deleteFCMToken = async (token: string) => {
  const { data } = await http.patch("/fcm_token/delete", { token });
  return data;
};

// fetchNotifications, fetchUnreadNotifications, readNotification, readAllNotification : 알림 관련
interface NotificationQuery {
  query: {
    page?: number;
  };
}

export const fetchNotifications = async ({ query }: NotificationQuery) => {
  const qs = queryBuilder(query);
  const { data } = await http.get(`/notifications/?${qs}`);
  return data;
};

export const fetchUnreadNotifications = async ({
  query,
}: NotificationQuery) => {
  const qs = queryBuilder({ ...query, is_read: 0 });
  const { data } = await http.get(`/notifications/?${qs}`);
  return data;
};

export const readNotification = async (notiId: number | string) => {
  const { data } = await http.post(`/notifications/${notiId}/read/`);
  return data;
};

export const readAllNotification = async () => {
  const { data } = await http.post("/notifications/read_all/");
  return data;
};

// SearchUser : 유저 검색
export const searchUser = async (query: string = "") => {
  const { data } = await http.get(`/user_profiles/search/?query=${query}`);
  return data;
};

const SEASON = ["봄", "여름", "가을", "겨울"] as const;
export const fetchCourses = async (year?: number, semester?: typeof SEASON[number]) => {
  try {
    const params = new URLSearchParams();
    
    if (year !== undefined) params.append("year", year.toString());
    if (semester !== undefined) params.append("semester", (SEASON.indexOf(semester) + 1).toString());

    const queryString = params.toString();
    const url = `/courses/${queryString ? `?${queryString}` : ""}`;
    const { data } = await http.get(url);
    return data;
  }
  // TEST
  catch {
    return Array(9).fill({
      id: 50,
      course_code: "PH.30001",
      title: "양자역학 I",
      department_name: "물리학과",
      year: 2026,
      semester: 1,
      credit: "3.0",
      professors: [{ id: 2903, name: "최재윤" }],
      enrollment_count: 1,
      last_synced_at: "2026-05-12T02:12:20.734487+09:00",
    });
  }
}