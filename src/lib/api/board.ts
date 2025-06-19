import http from '@/lib/api/http';
import { queryBuilder } from '@/lib/utils/queryBuilder';

type QueryValue = string | number | boolean | null | undefined;
type Filter = {
  communication_article__school_response_status?: number;
  communication_article__school_response_status__lt?: number;
};

type ArticleQuery = {
  boardId?: number | number[];
  topicId?: number;
  username?: string;
  query?: string;
  ordering?: string;
  page?: number;
  pageSize?: number;
  filter?: Filter;
};

function buildArticleParams(params: ArticleQuery): Record<string, QueryValue> {
  const context: Record<string, QueryValue> = {};

  if (params.boardId) {
    if (Array.isArray(params.boardId)) {
      context.parent_board__in = params.boardId.join(',');
    } else {
      context.parent_board = params.boardId;
    }
  }

  if (params.topicId) context.parent_topic = params.topicId;
  if (params.ordering) context.ordering = params.ordering;
  if (params.query) context.main_search__contains = params.query;
  if (params.username) context.created_by = params.username;

  const filter = params.filter;
  if (filter) {
    if (filter.communication_article__school_response_status !== undefined) {
      context.communication_article__school_response_status = filter.communication_article__school_response_status;
    } else if (filter.communication_article__school_response_status__lt !== undefined) {
      context.communication_article__school_response_status__lt = filter.communication_article__school_response_status__lt;
    }
  }

  if (params.page) context.page = params.page;
  if (params.pageSize) context.page_size = params.pageSize;

  return context;
}

//게시판 리스트 가져오기
export const fetchBoardList = () =>
  http.get('boards/').then(({ data }) => data);

//게시판 그룹 정보 가져오기
export const fetchBoardGroups = () =>
  http.get('board_groups/').then(({ data }) => data);

//일반 게시글 목록 조회
export const fetchArticles = (params: ArticleQuery = {}) =>
  http.get(`articles/?${queryBuilder(buildArticleParams(params))}`).then(({ data }) => data);

//추천 게시글 (top) 목록 조회
export const fetchTopArticles = (params: ArticleQuery = {}) =>
  http.get(`articles/top/?${queryBuilder(buildArticleParams(params))}`).then(({ data }) => data);

//Scrap 목록 조회
export const fetchArchives = (params: { query?: string; page?: number; pageSize?: number } = {}) => {
  const context: Record<string, QueryValue> = {};
  if (params.query) context.main_search__contains = params.query;
  if (params.page) context.page = params.page;
  if (params.pageSize) context.page_size = params.pageSize;

  return http.get(`scraps/?${queryBuilder(context)}`).then(({ data }) => data);
};

// Todo : parent_article type issue 해결하기
export const fetchArchivedPosts = async (params?: Parameters<typeof fetchArchives>[0]) => {
  const archive = await fetchArchives(params);
  return {
    ...archive,
    results: archive.results?.map(
      (item: { parent_article: unknown }) => item.parent_article
    ),
  };
};

//최근 본 게시글 조회
export const fetchRecentViewedPosts = (params: { query?: string; page?: number; pageSize?: number } = {}) => {
  const context: Record<string, QueryValue> = {};
  if (params.query) context.main_search__contains = params.query;
  if (params.page) context.page = params.page;
  if (params.pageSize) context.page_size = params.pageSize;

  return http.get(`articles/recent/?${queryBuilder(context)}`).then(({ data }) => data);
};

// Todo : 주석 달기
type BoardQuery = {
  boardId: number;
  query?: string;
  page?: number;
  pageSize?: number;
  order?: string;
};

function buildBoardQuery({ boardId, ...params }: BoardQuery, status = 3) {
  const context: Record<string, QueryValue> = {
    school_response_status: status,
  };

  if (params.query) context.main_search__contains = params.query;
  if (params.page) context.page = params.page;
  if (params.pageSize) context.page_size = params.pageSize;
  if (params.order) context.order = params.order;

  return http.get(`board/${boardId}?${queryBuilder(context)}`).then(({ data }) => data);
}

export const fetchAnsweredPostinTimeOrder = (params: BoardQuery) =>
  buildBoardQuery(params);

export const fetchUnansweredPostinTimeOrder = (params: BoardQuery) =>
  buildBoardQuery(params);

export const fetchAnsweredPostinPositiveOrder = (params: BoardQuery) =>
  buildBoardQuery({ ...params, order: 'article__positive_vote_count' });

export const fetchUnansweredPostinPositiveOrder = (params: BoardQuery) =>
  buildBoardQuery({ ...params, order: 'article__positive_vote_count' });

export const fetchAllPostinPositiveOrder = (params: BoardQuery) =>
  buildBoardQuery({ ...params, order: 'article__positive_vote_count' });

//신고 목록 조회
export const fetchReports = () =>
  http.get('reports/').then(({ data }) => data);