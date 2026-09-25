import http from '@/lib/api/http';
import { apiDetail } from '@/lib/api/delivery';
import type { ReportBody, ReportTarget, ReportType } from '@/lib/types/report';

const targetFields = (target: ReportTarget): Omit<ReportBody, 'type' | 'content'> => {
    switch (target.kind) {
        case 'article':
            return { parent_article: target.articleId };
        case 'comment':
            return { parent_comment: target.commentId };
        case 'chat_message':
            return { chat_message: target.messageId };
        case 'chat_member':
            return { chat_room: target.roomId, anon_number: target.anonNumber };
        case 'chat_user':
            return { chat_room: target.roomId, reported_user: target.userId };
    }
};

// The reporter comes from the session only; nothing that names them is sent.
export const submitReport = async (target: ReportTarget, type: ReportType, content: string) => {
    const body: ReportBody = { ...targetFields(target), type, content };
    const { data } = await http.post<{ id: number }>('reports/', body);
    return data;
};

// Chat repeats (same person, same room, 24h) come back as a detail; article/comment repeats hit the unique constraint, localized by Accept-Language.
const ALREADY_REPORTED = ['이미 신고했어요.', '이미 신고한 글입니다.', 'You already reported this article.'];

export const isAlreadyReported = (e: unknown) => ALREADY_REPORTED.includes(apiDetail(e));
