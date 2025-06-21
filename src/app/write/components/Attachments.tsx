'use client';

import React, {
  useState,
  useImperativeHandle,
  forwardRef,
  useRef,
  useEffect,
} from 'react';

const ALLOWED_EXTENSIONS = [
  'txt', 'docx', 'doc', 'pptx', 'ppt', 'pdf', 'hwp', 'zip', '7z',
  'png', 'jpg', 'jpeg', 'gif',
];

export interface UploadObject {
  key: string;
  name: string;
  type: string; // 'image', 'text', ...
  uploaded: boolean;
  file?: File;
  url?: string;
  blobUrl?: string | null;
}

export interface AttachmentsHandles {
  handleUpload: (files: FileList | File[]) => void;
  files: UploadObject[];
  openImageUpload: () => void;
}

export interface AttachmentsProps {
  multiple?: boolean;
  onAdd?: (files: UploadObject[]) => void;
  onDelete?: (file: UploadObject) => void;
  accepted?: string; // ex) ".png,.jpg"
}

const Attachments = forwardRef<AttachmentsHandles, AttachmentsProps>((props, ref) => {
  const { multiple = false, onAdd, onDelete, accepted } = props;

  const [files, setFiles] = useState<UploadObject[]>([]);
  const [dropzoneEnabled, setDropzoneEnabled] = useState(false);
  const [dropzoneFailedReason, setDropzoneFailedReason] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Paste 이벤트 리스너
  useEffect(() => {
    const pasteListener = (event: ClipboardEvent) => {
      const dataTransfer = event.clipboardData;
      if (!dataTransfer) return;

      const fileItems = Array.from(dataTransfer.items).filter(item => item.kind === 'file');

      if (fileItems.length === 0) return;

      event.preventDefault();
      event.stopPropagation();

      const pastedFiles = fileItems.map(item => item.getAsFile()).filter(Boolean) as File[];

      handleUpload(pastedFiles);
    };

    document.addEventListener('paste', pasteListener);
    return () => {
      document.removeEventListener('paste', pasteListener);
      // blobUrl 해제
      files.forEach(file => {
        if (file.blobUrl) {
          URL.revokeObjectURL(file.blobUrl);
        }
      });
    };
  }, [files]);

  // 파일 업로드 처리
  const handleUpload = (fileList: FileList | File[]) => {
    const filesArray = Array.from(fileList);

    const [success, error] = filesArray.reduce<[UploadObject[], UploadObject[]]>(
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
      [[], []]
    );

    if (error.length > 0) {
      setDropzoneFailedReason('dropzone-unallowed-extensions');
      setTimeout(() => {
        setDropzoneFailedReason(null);
      }, 1500);
    }

    setFiles(prev => [...prev, ...success]);
    if (onAdd) onAdd(success);
  };

  // 드래그 & 드롭 업로드 처리
  const handleDropUpload = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setDropzoneEnabled(false);

    if (!event.dataTransfer) return;

    handleUpload(event.dataTransfer.files);
  };

  // 다이얼로그 업로드
  const handleDialogUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = event.target.files;
    if (!fileList) return;

    handleUpload(fileList);
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
    setFiles(prev => prev.filter(f => f.key !== file.key));
    if (file.blobUrl) {
      URL.revokeObjectURL(file.blobUrl);
    }
    if (onDelete) onDelete(file);
  };

  // 외부에서 접근 가능한 메서드
  useImperativeHandle(ref, () => ({
    handleUpload,
    files,
    openImageUpload: () => {
      imageInputRef.current?.click();
    },
  }), [files]);

  return (
    <div
      className={`attachments ${
        dropzoneFailedReason ? 'attachments--failed' : ''
      } ${dropzoneEnabled ? 'attachments--enabled' : ''}`}
    >
      <div className="attachments__header flex items-center justify-between mb-5">
        <h2 className="attachments__title text-xl font-semibold">
          첨부파일
        </h2>
        <button
          type="button"
          className="attachments__upload button bg-red-500 text-white px-4 py-1 rounded"
          onClick={() => fileInputRef.current?.click()}
        >
          가져오기
        </button>
      </div>

      <div className="attachments__content relative bg-gray-100 border border-gray-300 rounded p-5 flex flex-col">
        <label
          className="attachments__dropzone dropzone absolute inset-0 z-10 cursor-pointer"
          onDragOver={e => {
            e.preventDefault();
            setDropzoneEnabled(true);
          }}
          onDragLeave={e => {
            e.preventDefault();
            setDropzoneEnabled(false);
          }}
          onDrop={handleDropUpload}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={accepted ?? ALLOWED_EXTENSIONS.map(ext => `.${ext}`).join(',')}
            multiple={multiple}
            className="dropzone__upload hidden"
            onChange={handleDialogUpload}
          />
        </label>

        <span className="attachments__message pl-5 pb-7 text-gray-500 font-medium">
          {dropzoneFailedReason === 'dropzone-unallowed-extensions' ? (
            '허용되지 않은 확장자입니다.'
          ) : dropzoneEnabled ? (
            '여기에 드롭해주세요.'
          ) : (
            '가져오기 버튼을 클릭하거나 복사한 이미지를 붙여넣거나, 파일을 드래그 앤 드롭하세요.'
          )}
        </span>

        <div className="attachments__filelist space-y-3">
          {files.map(file => (
            <div
              key={file.key}
              className="attachments__file file flex flex-col pointer-events-none p-3 bg-white rounded"
            >
              {file.type === 'image' && (
                <img
                  src={file.blobUrl ?? undefined}
                  alt={file.name}
                  className="file__thumbnail max-w-xs max-h-24 object-cover mb-2"
                />
              )}

              <div className="file__details flex justify-between items-center pointer-events-auto">
                <span>{file.name}</span>
                <button
                  type="button"
                  className="file__delete bg-transparent border-none rounded p-1 hover:bg-gray-300"
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
});

Attachments.displayName = 'Attachments';

export default Attachments;
