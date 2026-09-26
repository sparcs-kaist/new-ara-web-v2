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

export const submitReport = async (target: ReportTarget, type: ReportType, content: string) => {
    const body: ReportBody = { ...targetFields(target), type, content };
    const { data } = await http.post<{ id: number }>('reports/', body);
    return data;
};

// Repeat reports: chat's detail, then the localized unique-constraint error.
const ALREADY_REPORTED = ['이미 신고했어요.', '이미 신고한 글입니다.', 'You already reported this article.'];

export const isAlreadyReported = (e: unknown) => ALREADY_REPORTED.includes(apiDetail(e));

// Hidden or deleted posts answer 403 {message}; apiDetail reads only {detail}.
export const reportError = (e: unknown) => {
    const message = (e as { response?: { data?: { message?: unknown } } })?.response?.data?.message;
    return typeof message === 'string' && message ? message : apiDetail(e);
};
