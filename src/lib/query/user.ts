import { useQuery } from "@tanstack/react-query";
import { fetchBlocks, fetchMe } from "@/lib/api/user";

export const useMe = () => {
  return useQuery({
    queryKey: ["me"],
    queryFn: fetchMe,
    staleTime: 300000,
    retry: false,
    refetchOnWindowFocus: false,
  });
};

// 사용자가 차단한 유저 목록 조회
export const useBlockList = () => {
  return useQuery({
    queryKey: ["blockList"],
    queryFn: fetchBlocks,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });
};
