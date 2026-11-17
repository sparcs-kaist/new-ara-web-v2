"use client";

import React, {
  useState,
  useImperativeHandle,
  forwardRef,
  useRef,
  useEffect,
  useCallback,
} from "react";
import Image from "next/image";
import { useAttachmentUploads, type UploadObject } from '@/lib/useAttachmentUploads';
export type { UploadObject } from '@/lib/useAttachmentUploads';

const ALLOWED_EXTENSIONS = [
  "txt",
  "docx",
  "doc",
  "pptx",
  "ppt",
  "pdf",
  "hwp",
  "zip",
  "7z",
  "png",
  "jpg",
  "jpeg",
  "gif",
];

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

const Attachments = forwardRef<AttachmentsHandles, AttachmentsProps>(
  (props, ref) => {
    const { multiple = false, onAdd, onDelete, accepted, initialFiles } = props;

    const { files, filesRef, setFiles, upload, retry, remove } = useAttachmentUploads(onAdd);
    const [dropzoneEnabled, setDropzoneEnabled] = useState(false);

    //자식 요소위에서도 drag state를 관리하기 위해 counter 사용
    //자식 요소까지 완전히 벗어났을 때 (counter = 0) 되었을 때만 dropzone 비활성화
    const [, setDragCounter] = useState(0);

    const [dropzoneFailedReason, setDropzoneFailedReason] = useState<
      string | null
    >(null);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);
// 파일 업로드 처리
    const handleUpload = useCallback(async (fileList: FileList | File[]) => {
      const selected = Array.from(fileList);
      const allowed = selected.filter(file => ALLOWED_EXTENSIONS.includes(file.name.split('.').pop()?.toLowerCase() ?? ''));
      if (allowed.length !== selected.length) {
        setDropzoneFailedReason('dropzone-unallowed-extensions');
        setTimeout(() => setDropzoneFailedReason(null), 1500);
      }
      return upload(allowed);
    }, [upload]);
    
    // Paste 이벤트 리스너
    useEffect(() => {
      const pasteListener = (event: ClipboardEvent) => {
        const dataTransfer = event.clipboardData;
        if (!dataTransfer) return;

        const fileItems = Array.from(dataTransfer.items).filter(
          (item) => item.kind === "file",
        );

        if (fileItems.length === 0) return;

        event.preventDefault();
        event.stopPropagation();

        const pastedFiles = fileItems
          .map((item) => item.getAsFile())
          .filter(Boolean) as File[];

        handleUpload(pastedFiles);
      };

      document.addEventListener("paste", pasteListener);
      return () => {
        document.removeEventListener("paste", pasteListener);
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

    

    //drag enter/leave 이벤트 헨들러
    const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragCounter((c) => c + 1);
      if (e.dataTransfer.items.length > 0) {
        setDropzoneEnabled(true);
      }
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragCounter((c) => {
        const next = c - 1;
        if (next <= 0) {
          setDropzoneEnabled(false);
          return 0;
        }
        return next;
      });
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
    };

    // 드래그 & 드롭 업로드 처리
    const handleDropUpload = (e: React.DragEvent<HTMLLabelElement>) => {
      e.preventDefault();
      setDropzoneEnabled(false);
      setDragCounter(0);

      if (!e.dataTransfer) return;

      handleUpload(e.dataTransfer.files);
    };

    // 다이얼로그 업로드
    const handleDialogUpload = async (
      event: React.ChangeEvent<HTMLInputElement>,
    ) => {
      const fileList = event.target.files;
      if (!fileList) return;

      await handleUpload(fileList);
      // 파일 input 초기화 (같은 파일 업로드를 위한)
      event.target.value = "";
    };

    // 이미지 업로드 input change
    const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
      const fileList = event.target.files;
      if (!fileList) return;

      handleUpload(fileList);
      event.target.value = "";
    };

    // 파일 삭제
    const deleteFile = (file: UploadObject) => {
      remove(file);
      if (onDelete) onDelete(file);
    };

    // 외부에서 접근 가능한 메서드
    useImperativeHandle(
      ref,
      () => ({
        handleUpload,
        get files() { return filesRef.current; },
        openImageUpload: () => {
          imageInputRef.current?.click();
        },
      }),
      [filesRef, handleUpload],
    );

    return (
      <div
        className={`attachments ${dropzoneEnabled ? "attachments--enabled" : ""}`}
      >
        <div className="attachments__header flex items-center justify-between mb-5">
          <h3 className="attachments__title text-lg font-semibold">첨부파일</h3>
          <button
            type="button"
            className="attachments__upload button bg-gray-100 text-red-400 px-4 py-1 rounded-full font-medium"
            onClick={() => fileInputRef.current?.click()}
          >
            첨부하기
          </button>
        </div>

        <div
          className="attachments__content relative bg-[#fafafa] border border-gray-300 rounded p-5 flex flex-col"
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <label
            className={`attachments__dropzone absolute inset-0 z-10 cursor-pointer ${
              dropzoneEnabled ? "pointer-events-auto" : "pointer-events-none"
            }`}
            onDrop={handleDropUpload}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept={
                accepted ?? ALLOWED_EXTENSIONS.map((ext) => `.${ext}`).join(",")
              }
              multiple={multiple}
              className="dropzone__upload hidden"
              onChange={handleDialogUpload}
            />
          </label>

          <span className="pb-7 text-gray-400 font-medium">
            {dropzoneFailedReason === "dropzone-unallowed-extensions"
              ? "허용되지 않은 확장자입니다."
              : dropzoneEnabled
                ? "여기에 드롭해주세요."
                : "가져오기 버튼을 클릭하거나 복사한 이미지를 본문에서 붙여넣기, 또는 파일을 드래그 앤 드롭해 주세요"}
          </span>

          <div className="space-y-3">
            {files.map((file) => (
              <div
                key={file.key}
                className="file flex flex-col pointer-events-none p-3 bg-[#fafafa] rounded-xl
              hover:bg-[#ececec] transition-colors duration-200"
              >
                {file.type === "image" && file.blobUrl && (
                  <Image
                    src={file.url ?? file.blobUrl}
                    alt={file.name || ""}
                    width={200}
                    height={200}
                    className="max-w-xs max-h-24 object-cover mb-2"
                  />
                )}

                <div className="flex justify-between items-center pointer-events-auto gap-3">
                  <span className="flex-1 min-w-0 truncate" title={file.name}>
                    {file.name}
                  </span>
                  <span role="status" className="text-sm text-gray-500">
                    {file.status === 'uploading' ? '업로드 중…' : file.status === 'failed' ? file.error : '완료'}
                  </span>
                  {file.status === 'failed' && <button type="button" onClick={() => void retry(file.key)}>재시도</button>}
                  <button
                    type="button"
                    className="bg-transparent font-normal text-[#ed3a3a] rounded-full px-3 py-0.5 shrink-0
                  hover:bg-[#ed3a3a] hover:text-white transition-colors duration-200"
                    onClick={() => deleteFile(file)}
                  >
                    삭제
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          multiple={false}
          className="dropzone__upload hidden"
          onChange={handleImageUpload}
        />
      </div>
    );
  },
);

Attachments.displayName = "Attachments";

export default Attachments;
