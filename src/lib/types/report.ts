// PROVISIONAL: the chat report API is proposed to the backend; its field names live only here and in lib/api/report.ts.

export type ReportType = 'violation_of_code' | 'impersonation' | 'insult' | 'spam' | 'others';

/** What a chat report points at, in app terms; lib/api/report.ts maps it to the request fields. */
export type ChatReportTarget = { kind: 'message'; messageId: number } | { kind: 'member'; roomId: number; anonNumber: number };

export interface ChatReportBody {
    parent_chat_message?: number;
    chat_room?: number;
    anon_number?: number;
    reported_user?: number;
    type: ReportType;
    content?: string;
}
