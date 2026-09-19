import { useMutation, useQuery } from "@tanstack/react-query";
import { addUserMajor, fetchCourseTerms, fetchMajors, fetchMyMajors, removeUserMajor } from "@/lib/api/campus";
import { fetchCourses } from "@/lib/api/user";
import { queryClient } from "@/lib/queryClient";

export const useCourseTerms = () => {
  return useQuery({
    queryKey: ["courseTerms"],
    queryFn: fetchCourseTerms,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });
};

export const useCourses = (year?: number, semester?: "봄" | "여름" | "가을" | "겨울") => {
  return useQuery({
    queryKey: ["courseList", year, semester],
    queryFn: () => fetchCourses(year, semester),
    // 학기가 정해지기 전에 요청하면 전 학기 과목을 통째로 받아온다
    enabled: year !== undefined,
    staleTime: 300000,
    refetchOnWindowFocus: false,
  });
};

export const useMyMajors = () => {
  return useQuery({
    queryKey: ["myMajors"],
    queryFn: fetchMyMajors,
    staleTime: 300000,
    refetchOnWindowFocus: false,
  });
};

export const useMajors = () => {
  return useQuery({
    queryKey: ["majors"],
    queryFn: fetchMajors,
    staleTime: 300000,
    refetchOnWindowFocus: false,
  });
};

export const useUserMajorMutation = () => {
  return useMutation({
    mutationFn: ({ stdDeptId, add }: { stdDeptId: number | string; add: boolean }) =>
      add ? addUserMajor(stdDeptId) : removeUserMajor(stdDeptId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["majors"] });
      queryClient.invalidateQueries({ queryKey: ["myMajors"] });
    },
  });
};
