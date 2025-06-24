/* eslint-disable @typescript-eslint/no-explicit-any */
type WhyHidden = 'ADULT_CONTENT' | 'SOCIAL_CONTENT' | 'REPORTED_CONTENT' | 'BLOCKED_USER_CONTENT'
type Attachment = 'NONE' | 'IMAGE' | 'NON_IMAGE' | 'BOTH'


export type ParentTopic = {
  id : number;
  slug : string;
  ko_name : string;
  en_name : string;
}

export type BoardGroup = {
  id : number;
  ko_name : string;
  en_name : string;
  slug : string;
}

export type ParentBoard = {
  id : number;
  slug : string;
  ko_name : string;
  en_name : string;
  is_read_only : boolean;
  name_type : number;
  group : BoardGroup;
  banner_image : string;
  ko_board_description : string;
  en_board_description : string;
  top_threshold : number;
}

export type Post = {
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
  parent_board: ParentBoard,
  parent_topic: ParentTopic,
  positive_vote_count: number,
  read_status: string,
  report_count: number,
  title: string,
  updated_at: string,
  url: string,
  why_hidden: WhyHidden[]
}