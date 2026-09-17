import http from "@/lib/api/http";
import { queryClient } from "../queryClient";
import { useQuery, useQueryClient } from "@tanstack/react-query";

type VoteAction = "vote_cancel" | "vote_negative" | "vote_positive";
interface PostParams {
  postId: number;
  context?: VoteAction;
  fromView?: string;
  current?: number;
  overrideHidden?: boolean;
}

interface AttachmentParams {
  file: File;
  alias?: string | null;
}

// 게시글 단건 조회 (context에 vote action을 넣으면 해당 액션 경로 호출)
export const fetchPost = async ({
  postId,
  context,
  fromView,
  current,
  overrideHidden,
}: PostParams) => {
  const baseUrl = context
    ? `articles/${postId}/${context}/`
    : `articles/${postId}/`;

  const params = new URLSearchParams();
  if (fromView) params.append("from_view", fromView);
  if (current !== undefined) params.append("current", current.toString());
  if (overrideHidden !== undefined)
    params.append("override_hidden", overrideHidden.toString());

  const url = params.toString() ? `${baseUrl}?${params}` : baseUrl;
  const { data } = await http.get(url);
  return data;
};

export const usePost = ({
  postId,
  context,
  fromView = "all",
  current = 3,
  overrideHidden = true,
}: PostParams) => {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: [
      "article",
      postId,
      context ?? null,
      fromView ?? null,
      current ?? null,
      overrideHidden ?? null,
    ],
    queryFn: () =>
      fetchPost({
        postId,
        context,
        fromView,
        current,
        overrideHidden,
      }),
    placeholderData: () => {
      /* eslint-disable-next-line */
      const queries: [readonly any[], any][] = queryClient.getQueriesData({
        queryKey: ["articles"],
      });

      for (const [, data] of queries) {
        /* eslint-disable-next-line */
        const found = data?.results?.find((p: any) => p.id === postId);
        if (found) {
          return found;
        }
      }

      return undefined;
    },
    staleTime: 1000 * 60,
  });
};

// 게시글 생성
export const createPost = async ({
  boardId,
  newArticle,
}: {
  boardId: number;
  newArticle: Record<string, unknown>;
}) => {
  const { data } = await http.post("articles/", {
    ...newArticle,
    parent_board: boardId,
  });

  // useMe 호출을 다시 호출해야 게시물 개수 갱신 가능
  queryClient.invalidateQueries({ queryKey: ["me"] });
  return data;
};

// 게시글 수정
export const updatePost = async ({
  postId,
  newArticle,
}: {
  postId: number;
  newArticle: Record<string, unknown>;
}) => {
  const { data } = await http.put(`articles/${postId}/`, {
    ...newArticle,
  });
  return data;
};

// 게시글 스크랩
export const archivePost = async (postId: number) => {
  const { data } = await http.post("scraps/", { parent_article: postId });
  return data;
};

// 스크랩 해제
export const unarchivePost = async (scrapId: number) => {
  const { data } = await http.delete(`scraps/${scrapId}/`);
  return data;
};

// 게시글 신고
export const reportPost = async (
  postId: number,
  typeReport: string,
  reasonReport: string,
) => {
  const { data } = await http.post("reports/", {
    parent_article: postId,
    type: typeReport,
    content: reasonReport,
  });
  return data;
};

// 게시글 삭제
export const deletePost = async (postId: number) => {
  const { data } = await http.delete(`articles/${postId}/`);

  // useMe 호출을 다시 호출해야 게시물 개수 갱신 가능
  queryClient.invalidateQueries({ queryKey: ["me"] });
  return data;
};

// 게시글 추천/비추천 (vote action은 별도 함수로 분리하는게 나을 수도 있지만, 필요시 context로 대체 가능)
export const votePost = async (postId: number, action: VoteAction) => {
  const { data } = await http.post(`articles/${postId}/${action}/`);

  // useMe 호출을 다시 호출해야 vote 개수 갱신 가능
  queryClient.invalidateQueries({ queryKey: ["me"] });
  return data;
};

// 댓글 단건 조회 (context에 vote action을 넣으면 해당 액션 경로 호출)
export const fetchComment = async ({
  commentId,
  context,
}: {
  commentId: number;
  context?: VoteAction;
}) => {
  const url = context
    ? `comments/${commentId}/${context}/`
    : `comments/${commentId}/`;
  const { data } = await http.get(url);
  return data;
};

// 댓글 작성
export const createComment = async ({
  commentContent,
  parent_article_id,
  name_type,
}: {
  commentContent: string;
  parent_article_id: number;
  name_type: number;
}) => {
  const { data } = await http.post("comments/", {
    content: commentContent,
    parent_article: parent_article_id,
    name_type: name_type,
    attachment: null,
  });

  // useMe 호출을 다시 호출해야 댓글 개수 갱신 가능
  queryClient.invalidateQueries({ queryKey: ["me"] });
  return data; // return 추가
};

//대댓글 작성
export const createNestedComment = async ({
  commentContent,
  parent_comment_id,
  name_type,
}: {
  commentContent: string;
  parent_comment_id: number;
  name_type: number;
}) => {
  const { data } = await http.post("comments/", {
    content: commentContent,
    parent_comment: parent_comment_id,
    name_type: name_type,
    attachment: null,
  });

  // useMe 호출을 다시 호출해야 댓글 개수 갱신 가능
  queryClient.invalidateQueries({ queryKey: ["me"] });

  return data; // return 추가
};

// 댓글 수정
export const updateComment = async (
  commentId: number,
  newComment: string,
  name_type: number,
) => {
  const { data } = await http.patch(`comments/${commentId}/`, {
    content: newComment,
    name_type: name_type,
    is_mine: true,
  });
  return data;
};

// 댓글 추천/비추천
export const voteComment = async (commentId: number, action: VoteAction) => {
  const { data } = await http.post(`comments/${commentId}/${action}/`);

  // useMe 호출을 다시 호출해야 추천 개수 갱신 가능
  queryClient.invalidateQueries({ queryKey: ["me"] });

  return data;
};

// 댓글 신고
export const reportComment = async (
  commentId: number,
  typeReport: string = "others",
  reasonReport: string,
) => {
  const { data } = await http.post("reports/", {
    parent_comment: commentId,
    type: typeReport,
    content: reasonReport,
  });
  return data;
};

// 댓글 삭제
export const deleteComment = async (commentId: number) => {
  const { data } = await http.delete(`comments/${commentId}/`);

  // useMe 호출을 다시 호출해야 댓글 개수 갱신 가능
  queryClient.invalidateQueries({ queryKey: ["me"] });
  return data;
};

// 파일 업로드 (단일/다중)
export const uploadAttachments = async (
  attachments: AttachmentParams | AttachmentParams[],
) => {
  const generateFormData = (attachment: AttachmentParams) => {
    const formData = new FormData();
    formData.append("file", attachment.file);

    if (attachment.alias) {
      formData.append("alias", attachment.alias);
    }

    return formData;
  };

  const httpOptions = {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  };

  // @TODO: File type인지 체크하기
  if (Array.isArray(attachments)) {
    return Promise.all(
      attachments.map((attachment) =>
        http.post("attachments/", generateFormData(attachment), httpOptions),
      ),
    );
  }

  return http.post("attachments/", generateFormData(attachments), httpOptions);
};

export const fetchCoursePost = async ({ courseId, postId }: { courseId: number, postId: number}) => {
  const { data } = await http.get(`/courses/${courseId}/articles/${postId}`);
  return data
}

export const createCoursePost = async ({
  courseId,
  newArticle,
}: {
  courseId: number;
  newArticle: Record<string, unknown>;
}) => {
  const { data } = await http.post(`courses/${courseId}/articles/`, newArticle);

  queryClient.invalidateQueries({ queryKey: ["me"] });
  return data;
};