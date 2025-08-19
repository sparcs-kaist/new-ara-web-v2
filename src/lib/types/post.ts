type WhyHidden = 'ADULT_CONTENT' | 'SOCIAL_CONTENT' | 'REPORTED_CONTENT' | 'BLOCKED_USER_CONTENT'
type Attachment = 'NONE' | 'IMAGE' | 'NON_IMAGE' | 'BOTH' | 'FILE'
type ReadStatus = 'N' | '-'


// --- 추가된 공통 타입 정의 ---

export interface Author {
  id: number;
  username: string;
  profile: {
    picture: string;
    nickname: string;
    user: number;
    is_official: boolean;
    is_school_admin: boolean;
  };
  is_blocked: boolean;
}

export interface CommentNested {
  id: number;
  is_hidden: boolean;
  my_vote: boolean | null;
  is_mine: boolean;
  content: string;
  created_by: Author;
  positive_vote_count: number;
  negative_vote_count: number;
  created_at: string;
}

export interface Comment extends CommentNested {
  comments: CommentNested[];
}

export interface PostData {
  id: number;
  title: string;
  content: any; // 에디터 컨텐츠는 객체 또는 문자열일 수 있음
  negative_vote_count: number;
  positive_vote_count: number;
  my_vote: boolean | null;
  created_by: Author;
  parent_board: {
    id: number;
    slug: string;
    ko_name: string;
    en_name: string;
  };
  created_at: string;
  hit_count: number;
  comments: Comment[];
  // API 응답의 다른 필드들도 필요에 따라 추가할 수 있습니다.
}


// --- 기존 타입 정의 ---

export const enum NameType {
  NICKNAME = 1,
  ANONYMOUS = 2,
  NICKNAME_ANONYMOUS = 3,
  REALNAME = 4,
  NICKNAME_REALNAME = 5,
  ANONYMOUS_REALNAME = 6,
  NICKNAME_ANONYMOUS_REALNAME = 7,
}

export type ResponseParentTopic = {
  id: number;
  slug: string;
  ko_name: string;
  en_name: string;
}

export type ResponseBoardGroup = {
  id: number;
  ko_name: string;
  en_name: string;
  slug: string;
}

export type ResponseParentBoard = {
  id: number;
  slug: string;
  ko_name: string;
  en_name: string;
  is_read_only: boolean;
  name_type: number;
  group: ResponseBoardGroup;
  banner_image: string;
  ko_board_description: string;
  en_board_description: string;
  top_threshold: number;
}

export type ResponsePost = {
  attachment_type: Attachment,
  can_override_hidden: boolean,
  comment_count: number,
  commented_at: string,
  communication_article_status: 0 | 1 | 2 | null,
  content_updated_at: string,
  created_at: string,
  created_by: {
    id: string,
    profile: {
      nickname: string,
      picture: string,
      user: string
    },
    username: string
  },
  days_left: number,
  deleted_at: string,
  hidden_at: string,
  hit_count: number,
  id: number,
  name_type: number,
  is_content_sexual: boolean,
  is_content_social: boolean,
  is_hidden: boolean,
  negative_vote_count: number
  parent_board: ResponseParentBoard,
  parent_topic: ResponseParentTopic | null,
  positive_vote_count: number,
  read_status: ReadStatus
  report_count: number,
  title: string,
  updated_at: string,
  url: string,
  why_hidden: WhyHidden[]
}

export type ResponsePostList = {
  num_pages: number;
  num_items: number;
  current: number;
  previous: string | null;
  next: string | null;
  results: ResponsePost[];
}

// 게시판 ID와 이름의 mapping Enum
// 만약, DB가 뒤틀려서 프로덕션과 Dev가 달라질 경우 API를 통해 가져와야함.
export function getBoardKoNameById(boardId: number): string {
  switch (boardId) {
    case 1: return "포탈공지";
    case 2: return "학생 단체";
    case 3: return "구인구직";
    case 4: return "장터";
    case 5: return "입주 업체 피드백";
    case 7: return "자유게시판";
    case 8: return "운영진 공지";
    case 10: return "아라 피드백";
    case 11: return "입주 업체 공지";
    case 12: return "동아리";
    case 13: return "부동산";
    case 14: return "학교에게 전합니다";
    case 17: return "카이스트 뉴스";
    case 18: return "외부 업체 홍보";
    default: return "알 수 없음";
  }
}
