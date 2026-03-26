import { useQuery } from "@tanstack/react-query";
import { fetchBlocks, meQueryOptions } from "@/lib/api/user";

export const useMe = () => {
  return useQuery({
    ...meQueryOptions,
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
