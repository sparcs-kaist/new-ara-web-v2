import { useQuery } from "@tanstack/react-query";
import { fetchBoardList } from "@/lib/api/board";

// 게시판 목록(이름·slug·말머리)은 거의 바뀌지 않으므로 길게 캐시한다.
// NavBar와 /board 페이지가 같은 캐시를 공유한다.
export const useBoardList = <T,>() =>
  useQuery<T[]>({
    queryKey: ["boards"],
    queryFn: fetchBoardList,
    staleTime: 10 * 60_000,
  });
