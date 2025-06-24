import http from '@/lib/api/http';
import { queryBuilder } from '@/lib/utils/queryBuilder';

type QueryValue = string | number | boolean | null | undefined;
type Filter = {
  communication_article__school_response_status?: number;
  communication_article__school_response_status__lt?: number;
};

export type ArticleQuery = {
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
export const fetchBoardList = async () => {
  const { data } = await http.get('boards/');
  return data;
};

//게시판 그룹 정보 가져오기
export const fetchBoardGroups = async () => {
  const { data } = await http.get('board_groups/');
  return data;
};

//일반 게시글 목록 조회
export const fetchArticles = async (params: ArticleQuery = {}) => {
  const { data } = await http.get(`articles/?${queryBuilder(buildArticleParams(params))}`);
  return data;
};

//추천 게시글 (top) 목록 조회
export const fetchTopArticles = async (params: ArticleQuery = {}) => {
  const { data } = await http.get(`articles/top/?${queryBuilder(buildArticleParams(params))}`);
  return data;
};

//Scrap 목록 조회
export const fetchArchives = async (params: { query?: string; page?: number; pageSize?: number } = {}) => {
  const context: Record<string, QueryValue> = {};
  if (params.query) context.main_search__contains = params.query;
  if (params.page) context.page = params.page;
  if (params.pageSize) context.page_size = params.pageSize;

  const { data } = await http.get(`scraps/?${queryBuilder(context)}`);
  return data;
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
export const fetchRecentViewedPosts = async (params: { query?: string; page?: number; pageSize?: number } = {}) => {
  const context: Record<string, QueryValue> = {};
  if (params.query) context.main_search__contains = params.query;
  if (params.page) context.page = params.page;
  if (params.pageSize) context.page_size = params.pageSize;

  const { data } = await http.get(`articles/recent/?${queryBuilder(context)}`);
  return data;
};

// Todo : 주석 달기
type BoardQuery = {
  boardId: number;
  query?: string;
  page?: number;
  pageSize?: number;
  order?: string;
};

async function buildBoardQuery({ boardId, ...params }: BoardQuery, status = 3) {
  const context: Record<string, QueryValue> = {
    school_response_status: status,
  };

  if (params.query) context.main_search__contains = params.query;
  if (params.page) context.page = params.page;
  if (params.pageSize) context.page_size = params.pageSize;
  if (params.order) context.order = params.order;

  const { data } = await http.get(`board/${boardId}?${queryBuilder(context)}`);
  return data;
}

export const fetchAnsweredPostinTimeOrder = async (params: BoardQuery) =>
  buildBoardQuery(params);

export const fetchUnansweredPostinTimeOrder = async (params: BoardQuery) =>
  buildBoardQuery(params);

export const fetchAnsweredPostinPositiveOrder = async (params: BoardQuery) =>
  buildBoardQuery({ ...params, order: 'article__positive_vote_count' });

export const fetchUnansweredPostinPositiveOrder = async (params: BoardQuery) =>
  buildBoardQuery({ ...params, order: 'article__positive_vote_count' });

export const fetchAllPostinPositiveOrder = async (params: BoardQuery) =>
  buildBoardQuery({ ...params, order: 'article__positive_vote_count' });

//신고 목록 조회
export const fetchReports = async () => {
  const { data } = await http.get('reports/');
  return data;
};
