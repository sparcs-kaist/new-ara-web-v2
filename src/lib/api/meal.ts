import http from '@/lib/api/http';

type MealDate = string; // "YYYY-MM-DD" 형태 문자열

// 급식 메뉴 조회
export const fetchCafeteriaMenu = async (date: MealDate) => {
  const { data } = await http.get(`meals/${date}/cafeteria_menu`);
  return data;
};

// 코스 메뉴 조회
export const fetchCourseMenu = async (date: MealDate) => {
  const { data } = await http.get(`meals/${date}/course_menu`);
  return data;
};