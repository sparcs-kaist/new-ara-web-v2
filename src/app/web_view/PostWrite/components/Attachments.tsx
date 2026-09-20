'use client';

import React, {
    useState,
    useImperativeHandle,
    forwardRef,
    useRef,
    useEffect,
} from 'react';
import { uploadAttachments } from '@/lib/api/post';
import { AddIcon, ClipBadgeIcon } from '@/app/web_view/_components';
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

export interface UploadObject {
    key: string;
    name: string;
    type: string; // 'image', 'text', ...
    uploaded: boolean;
    file?: File;
    url?: string; //서버가 준 파일 URL
    blobUrl?: string | null; // local preview
}

export interface AttachmentsHandles {
    handleUpload: (files: FileList | File[]) => Promise<UploadObject[]>;
    files: UploadObject[];
    openImageUpload: () => void;
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
 * 첨부가 없으면 clip + "첨부파일 추가", 있으면 add 아이콘과 "첨부파일 N"
 * 토글이 나오고 그 아래에 파일 목록이 펼쳐진다.
 */
const Attachments = forwardRef<AttachmentsHandles, AttachmentsProps>(
    (props, ref) => {
        const { multiple = false, onAdd, onDelete, accepted, initialFiles } = props;

        const [files, setFiles] = useState<UploadObject[]>([]);
        const [listOpen, setListOpen] = useState(true);

        const [dropzoneFailedReason, setDropzoneFailedReason] = useState<
            string | null
        >(null);

        const fileInputRef = useRef<HTMLInputElement>(null);
        const imageInputRef = useRef<HTMLInputElement>(null);

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
                // blobUrl 해제
                files.forEach((file) => {
                    if (file.blobUrl) {
                        URL.revokeObjectURL(file.blobUrl);
                    }
                });
            };
        }, [files]);

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
        }, [initialFiles]);

        // 파일 업로드 처리
        const handleUpload = async (fileList: FileList | File[]) => {
            const filesArray = Array.from(fileList);

            const [success, error] = filesArray.reduce<
                [UploadObject[], UploadObject[]]
            >(
                ([successArr, errorArr], file) => {
                    const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
                    const isAllowed = ALLOWED_EXTENSIONS.includes(extension);

                    const uploadObject: UploadObject = {
                        key: Math.random().toString(36).slice(2),
                        type: file.type.split('/')[0],
                        name: file.name,
                        uploaded: false,
                        file,
                        blobUrl: undefined,
                    };

                    if (!isAllowed) {
                        errorArr.push(uploadObject);
                        return [successArr, errorArr];
                    }

                    if (uploadObject.type === 'image') {
                        uploadObject.blobUrl = URL.createObjectURL(file);
                    }

                    successArr.push(uploadObject);
                    return [successArr, errorArr];
                },
                [[], []],
            );

            if (error.length > 0) {
                setDropzoneFailedReason('dropzone-unallowed-extensions');
                setTimeout(() => {
                    setDropzoneFailedReason(null);
                }, 1500);
            }
            //upload to server
            const response = await uploadAttachments(
                success.map((u) => ({ file: u.file! })),
            );
            const result = Array.isArray(response) ? response : [response];

            // 서버에서 받은 id·url을 포함한 최종 배열 생성
            const updated: UploadObject[] = success.map((u, i) => {
                const { id, file: url } = result[i].data;
                return {
                    key: String(id),
                    name: u.name,
                    type: u.type,
                    uploaded: true,
                    file: u.file,
                    url,
                    blobUrl: url,
                };
            });

            // 최종 배열을 한 번에 state 에 추가
            setFiles((prev) => [...prev, ...updated]);
            setListOpen(true);

            // onAdd 콜백
            onAdd?.(updated);
            return updated;
        };

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
            setFiles((prev) => prev.filter((f) => f.key !== file.key));
            if (file.blobUrl) {
                URL.revokeObjectURL(file.blobUrl);
            }
            if (onDelete) onDelete(file);
        };

        // 외부에서 접근 가능한 메서드
        useImperativeHandle(
            ref,
            () => ({
                handleUpload,
                files,
                openImageUpload: () => {
                    imageInputRef.current?.click();
                },
            }),
            [files, handleUpload],
        );

        const pickFile = () => fileInputRef.current?.click();

        return (
            <div className="w-full">
                {files.length === 0 ? (
                    <button
                        type="button"
                        onClick={pickFile}
                        className="flex h-[34px] items-center px-[20px] text-[#636363]"
                    >
                        <ClipBadgeIcon size={34} />
                        <span className="ml-[4px] text-[16px] font-medium text-[#636363]">
                            {dropzoneFailedReason === 'dropzone-unallowed-extensions'
                                ? '허용되지 않은 확장자입니다.'
                                : '첨부파일 추가'}
                        </span>
                    </button>
                ) : (
                    <>
                        <div className="flex h-[34px] items-center px-[20px]">
                            <button
                                type="button"
                                onClick={pickFile}
                                aria-label="첨부파일 추가"
                                className="text-ara_red"
                            >
                                <AddIcon size={34} />
                            </button>
                            <button
                                type="button"
                                onClick={() => setListOpen((o) => !o)}
                                className="ml-auto flex h-[34px] items-center"
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

                        {dropzoneFailedReason === 'dropzone-unallowed-extensions' && (
                            <p className="px-[20px] pt-[6px] text-[14px] font-medium text-ara_red">
                                허용되지 않은 확장자입니다.
                            </p>
                        )}

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
