type WhyHidden = 'ADULT_CONTENT' | 'SOCIAL_CONTENT' | 'REPORTED_CONTENT' | 'BLOCKED_USER_CONTENT'
type Attachment = 'NONE' | 'IMAGE' | 'NON_IMAGE' | 'BOTH' | 'FILE'
type ReadStatus = 'N' | '-'


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
  id : number;
  slug : string;
  ko_name : string;
  en_name : string;
}

export type ResponseBoardGroup = {
  id : number;
  ko_name : string;
  en_name : string;
  slug : string;
}

export type ResponseParentBoard = {
  id : number;
  slug : string;
  ko_name : string;
  en_name : string;
  is_read_only : boolean;
  name_type : number;
  group : ResponseBoardGroup;
  banner_image : string;
  ko_board_description : string;
  en_board_description : string;
  top_threshold : number;
}

export type ResponsePost = {
  attachment_type: Attachment,
  can_override_hidden: boolean,
  comment_count: number,
  commented_at: string,
  communication_article_status: 0 | 1 | 2,
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
  num_pages : number;
  num_items : number;
  current: number;
  previous: string | null;
  next: string | null;
  results: ResponsePost[];
}