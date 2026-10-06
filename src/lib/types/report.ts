export type ReportType = 'violation_of_code' | 'impersonation' | 'insult' | 'spam' | 'others';

export type ReportTarget =
    | { kind: 'article'; articleId: number }
    | { kind: 'comment'; commentId: number }
    | { kind: 'chat_message'; messageId: number }
    | { kind: 'chat_member'; roomId: number; anonNumber: number }
    | { kind: 'chat_user'; roomId: number; userId: number };

export interface ReportBody {
    parent_article?: number;
    parent_comment?: number;
    chat_message?: number;
    chat_room?: number;
    anon_number?: number;
    reported_user?: number;
    type: ReportType;
    content: string;
}
