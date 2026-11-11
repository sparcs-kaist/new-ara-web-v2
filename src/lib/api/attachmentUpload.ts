import http from './http';
import type { AxiosResponse } from 'axios';

export interface AttachmentParams {
  file: File;
  alias?: string | null;
}

export interface UploadedAttachment {
  id: number;
  file: string;
  alias?: string;
}

interface UploadSession {
  id: string;
  upload_url: string;
  headers: Record<string, string>;
  expires_in: number;
}

const configuredMax = Number(process.env.NEXT_PUBLIC_ATTACHMENT_UPLOAD_MAX_BYTES);
export const attachmentUploadMaxBytes = Number.isSafeInteger(configuredMax) && configuredMax > 0
  ? Math.min(configuredMax, 5 * 1024 ** 3) : 5 * 1024 ** 3;

export function createAttachmentUpload(attachment: AttachmentParams) {
  let session: UploadSession | undefined;
  let expiresAt = 0;
  let transferred = false;
  let active: Promise<AxiosResponse<UploadedAttachment>> | undefined;
  let cancelled = false;
  let controller: AbortController | undefined;

  const run = async (): Promise<AxiosResponse<UploadedAttachment>> => {
    if (cancelled) throw new Error('업로드가 취소되었습니다.');
    if (attachment.file.size > attachmentUploadMaxBytes) {
      throw new Error(`파일 크기 제한(${attachmentUploadMaxBytes.toLocaleString()}바이트)을 초과했습니다.`);
    }
    controller = new AbortController();
    const options = { signal: controller.signal };
    if (!session || (!transferred && Date.now() >= expiresAt)) {
      const startedAt = Date.now();
      const response = await http.post<UploadSession>('attachments/uploads/', {
        filename: attachment.file.name,
        size: attachment.file.size,
        ...(attachment.alias != null ? { alias: attachment.alias } : {}),
      }, options);
      session = response.data;
      expiresAt = startedAt + session.expires_in * 1000;
    }
    if (!transferred) {
      const response = await fetch(session.upload_url, {
        method: 'PUT',
        headers: session.headers,
        body: attachment.file,
        credentials: 'omit',
        signal: controller.signal,
      });
      if (!response.ok && response.status !== 412) {
        throw new Error(`파일 전송 실패 (${response.status}). 다시 시도해 주세요.`);
      }
      transferred = true;
    }
    try {
      const response = await http.post<UploadedAttachment>(
        `attachments/uploads/${session.id}/complete/`, undefined,
        { ...options, validateStatus: status => (status >= 200 && status < 300) || status === 410 },
      );
      if (response.status === 410) {
        session = undefined;
        transferred = false;
        throw new Error('업로드 세션이 만료되었습니다. 다시 시도해 주세요.');
      }
      return response;
    } catch (error) {
      const status = (error as { response?: { status?: number } }).response?.status;
      if (status === 409) {
        session = undefined;
        transferred = false;
        throw new Error('업로드한 파일을 확인할 수 없습니다. 다시 업로드해 주세요.');
      }
      throw error;
    }
  };

  return {
    upload: () => {
      if (!active) active = run().finally(() => { active = undefined; });
      return active;
    },
    cancel: () => { cancelled = true; controller?.abort(); },
  };
}

export const uploadAttachments = async (attachments: AttachmentParams | AttachmentParams[]) => {
  if (Array.isArray(attachments)) {
    return Promise.all(attachments.map(attachment => createAttachmentUpload(attachment).upload()));
  }
  return createAttachmentUpload(attachments).upload();
};
