'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createAttachmentUpload } from './api/attachmentUpload';

export interface UploadObject {
  key: string;
  name: string;
  type: string;
  uploaded: boolean;
  file?: File;
  url?: string;
  blobUrl?: string | null;
  status?: 'uploading' | 'success' | 'failed';
  error?: string;
}

export const attachmentsReady = (files: UploadObject[]) => files.every(file => file.uploaded);

export function useAttachmentUploads(onAdd?: (files: UploadObject[]) => void) {
  const [files, renderFiles] = useState<UploadObject[]>([]);
  const filesRef = useRef<UploadObject[]>([]);
  const tasks = useRef(new Map<string, ReturnType<typeof createAttachmentUpload>>());
  const onAddRef = useRef(onAdd);
  onAddRef.current = onAdd;
  const setFiles = useCallback((update: (previous: UploadObject[]) => UploadObject[]) => {
    filesRef.current = update(filesRef.current);
    renderFiles(filesRef.current);
  }, []);

  const attempt = useCallback(async (key: string): Promise<UploadObject | undefined> => {
    const task = tasks.current.get(key);
    if (!task) return;
    setFiles(previous => previous.map(file => file.key === key ? { ...file, status: 'uploading', error: undefined } : file));
    try {
      const { data } = await task.upload();
      if (tasks.current.get(key) !== task) return;
      const original = filesRef.current.find(file => file.key === key);
      if (!original) return;
      const completed: UploadObject = { ...original, key: String(data.id), uploaded: true, status: 'success', url: data.file, blobUrl: data.file };
      if (original.blobUrl?.startsWith('blob:')) URL.revokeObjectURL(original.blobUrl);
      tasks.current.delete(key);
      setFiles(previous => previous.map(file => file.key === key ? completed : file));
      onAddRef.current?.([completed]);
      return completed;
    } catch (error) {
      if (tasks.current.get(key) !== task) return;
      setFiles(previous => previous.map(file => file.key === key ? {
        ...file, status: 'failed', error: error instanceof Error ? error.message : '업로드 실패. 다시 시도해 주세요.',
      } : file));
    }
  }, [setFiles]);

  const upload = useCallback(async (selected: File[]) => {
    const added = selected.map(file => ({
      key: crypto.randomUUID(), name: file.name, type: file.type.split('/')[0],
      uploaded: false, file, status: 'uploading' as const,
      blobUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
    }));
    added.forEach(file => tasks.current.set(file.key, createAttachmentUpload({ file: file.file, alias: file.name })));
    setFiles(previous => [...previous, ...added]);
    const results = await Promise.all(added.map(file => attempt(file.key)));
    return results.filter((file): file is UploadObject => file !== undefined);
  }, [attempt, setFiles]);

  const remove = useCallback((file: UploadObject) => {
    tasks.current.get(file.key)?.cancel();
    tasks.current.delete(file.key);
    setFiles(previous => previous.filter(existing => existing.key !== file.key));
    if (file.blobUrl?.startsWith('blob:')) URL.revokeObjectURL(file.blobUrl);
  }, [setFiles]);

  useEffect(() => () => {
    tasks.current.forEach(task => task.cancel());
    tasks.current.clear();
    filesRef.current.forEach(file => {
      if (file.blobUrl?.startsWith('blob:')) URL.revokeObjectURL(file.blobUrl);
    });
  }, []);

  return { files, filesRef, setFiles, upload, retry: attempt, remove };
}
