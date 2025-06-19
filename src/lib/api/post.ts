import http from '@/lib/api/http';

type VoteAction = 'vote_cancel' | 'vote_negative' | 'vote_positive';

// 게시글 단건 조회 (context에 vote action을 넣으면 해당 액션 경로 호출)
export const fetchPost = async ({
  postId,
  context,
}: {
  postId: number;
  context?: VoteAction;
}) => {
  const url = context
    ? `articles/${postId}/${context}/`
    : `articles/${postId}/`;
  const { data } = await http.get(url);
  return data;
};

// 게시글 생성
export const createPost = async ({
  boardId,
  newArticle,
}: {
  boardId: number;
  newArticle: Record<string, unknown>;
}) => {
  const { data } = await http.post('articles/', {
    ...newArticle,
    parent_board: boardId,
  });
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
  const { data } = await http.post('scraps/', { parent_article: postId });
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
  reasonReport: string
) => {
  const { data } = await http.post('reports/', {
    parent_article: postId,
    type: typeReport,
    content: reasonReport,
  });
  return data;
};

// 게시글 삭제
export const deletePost = async (postId: number) => {
  const { data } = await http.delete(`articles/${postId}/`);
  return data;
};

// 게시글 추천/비추천 (vote action은 별도 함수로 분리하는게 나을 수도 있지만, 필요시 context로 대체 가능)
export const votePost = async (postId: number, action: VoteAction) => {
  const { data } = await http.post(`articles/${postId}/${action}/`);
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
export const createComment = async (newComment: Record<string, unknown>) => {
  const { data } = await http.post('comments/', {
    ...newComment,
    attachment: null,
  });
  return data;
};

// 댓글 수정
export const updateComment = async (
  commentId: number,
  newComment: Record<string, unknown>
) => {
  const { data } = await http.patch(`comments/${commentId}/`, {
    ...newComment,
  });
  return data;
};

// 댓글 추천/비추천
export const voteComment = async (commentId: number, action: VoteAction) => {
  const { data } = await http.post(`comments/${commentId}/${action}/`);
  return data;
};

// 댓글 신고
export const reportComment = async (
  commentId: number,
  typeReport: string,
  reasonReport: string
) => {
  const { data } = await http.post('reports/', {
    parent_comment: commentId,
    type: typeReport,
    content: reasonReport,
  });
  return data;
};

// 댓글 삭제
export const deleteComment = async (commentId: number) => {
  const { data } = await http.delete(`comments/${commentId}/`);
  return data;
};

// 파일 업로드 (단일/다중)
export const uploadAttachments = async (attachments: File | File[]) => {
  const generateFormData = (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return formData;
  };

  const httpOptions = {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  };

  // @TODO: File type인지 체크하기
  if (Array.isArray(attachments)) {
    return Promise.all(
      attachments.map((attachment) =>
        http.post('attachments/', generateFormData(attachment), httpOptions)
      )
    );
  }

  return http.post('attachments/', generateFormData(attachments), httpOptions);
};
