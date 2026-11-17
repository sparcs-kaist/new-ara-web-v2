import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient();

// 게시글 작성/수정/삭제 후 목록·상세 캐시를 무효화한다.
// 목록 쿼리에 staleTime이 있어서, 이걸 부르지 않으면 방금 쓴 글이 목록에 바로 안 보인다.
export const invalidateArticleQueries = () =>
  Promise.all([
    queryClient.invalidateQueries({ queryKey: ["articles"] }),
    queryClient.invalidateQueries({ queryKey: ["article"] }),
    queryClient.invalidateQueries({ queryKey: ["posterArticles"] }),
    queryClient.invalidateQueries({ queryKey: ["home"] }),
    queryClient.invalidateQueries({ queryKey: ["majorArticles"] }),
    // ["courses"](과목 목록)와 겹치지 않도록 과목 게시글 목록(["courses", courseId, ...])만 대상으로 한다.
    queryClient.invalidateQueries({
      predicate: (q) => q.queryKey[0] === "courses" && q.queryKey.length > 1,
    }),
  ]);
