/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-wrapper-object-types */

export type RelatedArticle = {
  id: number;
  created_at: string;
  updated_at: string;
  deleted_at: string;
  title: string;
  name_type: number;
  is_content_sexual: boolean;
  is_content_social: boolean;
  hit_count: number;
  comment_count: number;
  report_count: number;
  positive_vote_count: number;
  negative_vote_count: number;
  commented_at: string;
  url: string | null;
  latest_portal_view_count?: number | null;
  content_updated_at?: string | null;
  hidden_at?: string | null;
  topped_at?: string | null;
  created_by: number;
  parent_topic: number | null;
  parent_board: number;
};

export type RelatedComment = {
  id: number;
  created_at: string;
  updated_at: string;
  deleted_at: string;
  content: string;
  name_type: number;
  report_count: number;
  positive_vote_count: number;
  negative_vote_count: number;
  hidden_at?: string | null;
  created_by: number;
  parent_article: number;
  parent_comment: number | null;
};

export type RelatedChatRoom = {
  id: number;
  room_title: string;
  room_type: string;
  chat_name_type: string;
  picture: string;
  recent_message_at: string;
  recent_message: number;
  created_at: string;
};

export type NotificationType = 'article_commented' | 'comment_commented' | 'chat_message';

export type Notification = {
  id: number;
  is_read: boolean;
  related_article: RelatedArticle | null;
  related_comment: RelatedComment | null;
  related_chat_room?: RelatedChatRoom | null;
  created_at: string;
  updated_at: string;
  deleted_at: string;
  type: NotificationType;
  title: string;
  content: string;
};