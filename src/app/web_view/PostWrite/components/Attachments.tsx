'use client';

import React, {
    useState,
    useImperativeHandle,
    forwardRef,
    useRef,
    useEffect,
    useCallback,
} from 'react';
import { useAttachmentUploads, type UploadObject } from '@/lib/useAttachmentUploads';
export type { UploadObject } from '@/lib/useAttachmentUploads';
import { ChevronDownIcon, ChevronUpIcon, CloseCircleIcon } from './icons';

const ALLOWED_EXTENSIONS = [
    'txt',
    'docx',
    'doc',
    'pptx',
    'ppt',
    'pdf',
    'hwp',
    'zip',
    '7z',
    'png',
    'jpg',
    'jpeg',
    'gif',
];

export interface AttachmentsHandles {
    handleUpload: (files: FileList | File[]) => Promise<UploadObject[]>;
    files: UploadObject[];
    openImageUpload: () => void;
    openFilePicker: () => void;
}

export interface AttachmentsProps {
    multiple?: boolean;
    onAdd?: (files: UploadObject[]) => void;
    onDelete?: (file: UploadObject) => void;
    accepted?: string; // ex) ".png,.jpg"
    initialFiles?: UploadObject[]; // Edit mode: preload existing attachments
}

// 44px 행 3개 + 5px 간격 2개 + 위쪽 10px (Flutter와 동일한 최대 높이)
const LIST_MAX_HEIGHT = 10 + 3 * 44 + 5 * 2;

const formatBytes = (bytes: number) => {
    if (!Number.isFinite(bytes) || bytes <= 0) return '';
    const units = ['B', 'KB', 'MB', 'GB'];
    const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
    const value = bytes / 1024 ** i;
    return `${value >= 100 || i === 0 ? Math.round(value) : value.toFixed(1)}${units[i]}`;
};

/**
 * Flutter `_buildAttachmentShow` (post_write_page.dart 963-1332).
 * 첨부가 있을 때만 "첨부파일 N" 토글과 그 아래 파일 목록이 나온다.
 * 추가는 글쓰기 하단 바의 clip 버튼이 `openFilePicker`로 연다.
 */
const Attachments = forwardRef<AttachmentsHandles, AttachmentsProps>(
    (props, ref) => {
        const { multiple = false, onAdd, onDelete, accepted, initialFiles } = props;

        const { files, filesRef, setFiles, upload, retry, remove } = useAttachmentUploads(onAdd);
        const [listOpen, setListOpen] = useState(true);

        const [dropzoneFailedReason, setDropzoneFailedReason] = useState<
            string | null
        >(null);

        const fileInputRef = useRef<HTMLInputElement>(null);
        const imageInputRef = useRef<HTMLInputElement>(null);

        const handleUpload = useCallback(async (fileList: FileList | File[]) => {
            const selected = Array.from(fileList);
            const allowed = selected.filter(file => ALLOWED_EXTENSIONS.includes(file.name.split('.').pop()?.toLowerCase() ?? ''));
            if (allowed.length !== selected.length) {
                setDropzoneFailedReason('dropzone-unallowed-extensions');
                setTimeout(() => setDropzoneFailedReason(null), 1500);
            }
            setListOpen(true);
            return upload(allowed);
        }, [upload]);

        // Paste 이벤트 리스너
        useEffect(() => {
            const pasteListener = (event: ClipboardEvent) => {
                const dataTransfer = event.clipboardData;
                if (!dataTransfer) return;

                const fileItems = Array.from(dataTransfer.items).filter(
                    (item) => item.kind === 'file',
                );

                if (fileItems.length === 0) return;

                event.preventDefault();
                event.stopPropagation();

                const pastedFiles = fileItems
                    .map((item) => item.getAsFile())
                    .filter(Boolean) as File[];

                handleUpload(pastedFiles);
            };

            document.addEventListener('paste', pasteListener);
            return () => {
                document.removeEventListener('paste', pasteListener);
            };
        }, [handleUpload]);

        // Merge initial files from parent (edit mode)
        useEffect(() => {
            if (!initialFiles || initialFiles.length === 0) return;
            setFiles((prev) => {
                const existing = new Set(prev.map((f) => f.key));
                const merged = [...prev];
                initialFiles.forEach((f) => {
                    if (!existing.has(f.key)) merged.push(f);
                });
                return merged;
            });
        }, [initialFiles, setFiles]);

        // 다이얼로그 업로드
        const handleDialogUpload = async (
            event: React.ChangeEvent<HTMLInputElement>,
        ) => {
            const fileList = event.target.files;
            if (!fileList) return;

            await handleUpload(fileList);
            // 파일 input 초기화 (같은 파일 업로드를 위한)
            event.target.value = '';
        };

        // 이미지 업로드 input change
        const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
            const fileList = event.target.files;
            if (!fileList) return;

            handleUpload(fileList);
            event.target.value = '';
        };

        // 파일 삭제
        const deleteFile = (file: UploadObject) => {
            remove(file);
            if (onDelete) onDelete(file);
        };

        const pickFile = () => fileInputRef.current?.click();

        // 외부에서 접근 가능한 메서드
        useImperativeHandle(
            ref,
            () => ({
                handleUpload,
                get files() { return filesRef.current; },
                openImageUpload: () => {
                    imageInputRef.current?.click();
                },
                openFilePicker: pickFile,
            }),
            [filesRef, handleUpload],
        );

        return (
            <div className="w-full">
                {dropzoneFailedReason === 'dropzone-unallowed-extensions' && (
                    <p className="px-[20px] pt-[6px] text-[14px] font-medium text-ara_red">
                        허용되지 않은 확장자입니다.
                    </p>
                )}

                {files.length > 0 && (
                    <>
                        <div className="flex h-[34px] items-center px-[20px]">
                            <button
                                type="button"
                                onClick={() => setListOpen((o) => !o)}
                                className="flex h-[34px] items-center"
                            >
                                <span className="text-[16px] font-medium text-black">첨부파일</span>
                                <span className="ml-[8px] text-[16px] font-medium text-ara_red">
                                    {files.length}
                                </span>
                                <span className="ml-[5px] text-ara_red">
                                    {listOpen ? (
                                        <ChevronUpIcon size={20} />
                                    ) : (
                                        <ChevronDownIcon size={20} />
                                    )}
                                </span>
                            </button>
                        </div>

                        {listOpen && (
                            <div
                                className="overflow-y-auto px-[15px] pt-[10px]"
                                style={{ maxHeight: LIST_MAX_HEIGHT }}
                            >
                                {files.map((file, index) => (
                                    <div
                                        key={file.key}
                                        className={`flex h-[44px] items-center rounded-[15px] border border-[#F0F0F0] pl-[12px] pr-[6px] ${index === 0 ? '' : 'mt-[5px]'}`}
                                    >
                                        <span className="min-w-0 flex-1 truncate text-[14px] text-black">
                                            {file.name}
                                        </span>
                                        <span role="status" className="text-sm text-gray-500">
                                            {file.status === 'uploading' ? '업로드 중…' : file.status === 'failed' ? file.error : '완료'}
                                        </span>
                                        {file.status === 'failed' && <button type="button" onClick={() => void retry(file.key)}>재시도</button>}
                                        {file.file && (
                                            <span className="ml-[6px] shrink-0 text-[14px] font-medium text-[#BBBBBB]">
                                                {formatBytes(file.file.size)}
                                            </span>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => deleteFile(file)}
                                            aria-label={`${file.name} 삭제`}
                                            className="ml-[3px] shrink-0 text-[#BBBBBB]"
                                        >
                                            <CloseCircleIcon size={30} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}

                <input
                    ref={fileInputRef}
                    type="file"
                    accept={accepted ?? ALLOWED_EXTENSIONS.map((ext) => `.${ext}`).join(',')}
                    multiple={multiple}
                    className="hidden"
                    onChange={handleDialogUpload}
                />
                <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    multiple={false}
                    className="hidden"
                    onChange={handleImageUpload}
                />
            </div>
        );
    },
);

Attachments.displayName = 'Attachments';

export default Attachments;
