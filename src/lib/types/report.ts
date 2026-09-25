// Report API (new-ara-api POST reports/); its field names live only here and in lib/api/report.ts.

export type ReportType = 'violation_of_code' | 'impersonation' | 'insult' | 'spam' | 'others';

/** What a report points at, in app terms; lib/api/report.ts maps it to the request fields. */
export type ReportTarget =
    | { kind: 'article'; articleId: number }
    | { kind: 'comment'; commentId: number }
    | { kind: 'chat_message'; messageId: number }
    | { kind: 'chat_member'; roomId: number; anonNumber: number }
    | { kind: 'chat_user'; roomId: number; userId: number };

/** Exactly one target: parent_article | parent_comment | chat_message | chat_room + (anon_number | reported_user). */
export interface ReportBody {
    parent_article?: number;
    parent_comment?: number;
    // Chat fields are provisional until the backend confirms the unified reports/ names.
    chat_message?: number;
    chat_room?: number;
    anon_number?: number;
    reported_user?: number;
    type: ReportType;
    content: string;
}
