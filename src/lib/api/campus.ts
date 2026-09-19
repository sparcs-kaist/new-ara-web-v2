import http from "@/lib/api/http";

// fetchCourseTerms : 내 수강 이력이 있는 (연도, 학기) 목록
export const fetchCourseTerms = async (): Promise<{ year: number; semester: number }[]> => {
  const { data } = await http.get("/courses/semester/");
  return data;
};

// fetchMajors, fetchMyMajors : 전체 학과 목록 / 내 학과 + 추가한 학과 (홈 학과가 첫 번째)
export const fetchMajors = async (): Promise<Major[]> => {
  const { data } = await http.get("/majors/");
  return data;
};

export const fetchMyMajors = async (): Promise<Major[]> => {
  const { data } = await http.get("/majors/my-major/");
  return data;
};

export const addUserMajor = async (stdDeptId: number | string) => {
  const { data } = await http.post(`/majors/${stdDeptId}/user_major_add/`);
  return data;
};

export const removeUserMajor = async (stdDeptId: number | string) => {
  const { data } = await http.post(`/majors/${stdDeptId}/user_major_remove/`);
  return data;
};
