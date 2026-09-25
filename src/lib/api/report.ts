import http from '@/lib/api/http';
import { apiDetail } from '@/lib/api/delivery';
import type { ChatReportBody, ChatReportTarget, ReportType } from '@/lib/types/report';

// The reporter comes from the session only; nothing that names them is sent.
export const reportChat = async (target: ChatReportTarget, type: ReportType, content: string) => {
    const body: ChatReportBody =
        target.kind === 'message'
            ? { message: target.messageId, type, content: content || undefined }
            : { chat_room: target.roomId, anon_number: target.anonNumber, type, content: content || undefined };
    const { data } = await http.post<{ id: number }>('chat/report/', body);
    return data;
};

/** A repeat report of the same target is refused with this 400 detail. */
export const isAlreadyReported = (e: unknown) => apiDetail(e) === '이미 신고했어요.';
