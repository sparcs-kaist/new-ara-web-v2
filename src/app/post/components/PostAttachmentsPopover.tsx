import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';

export interface PostAttachment {
    key: string;
    name: string;
    url: string;
    type: string;
}

interface Props {
    attachments: PostAttachment[];
}

const getIcon = (type: string) => {
    if (type === 'image') return '/icons/file-image.svg';
    if (type === 'pdf') return '/icons/file-pdf.svg';
    if (type === 'zip' || type === '7z') return '/icons/file-zip.svg';
    return '/icons/file-generic.svg';
};

const PostAttachmentsPopover: React.FC<Props> = ({ attachments }) => {
    const [open, setOpen] = useState(false);
    const popoverRef = useRef<HTMLDivElement>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        console.log('[PostAttachmentsPopover] mounted');
        if (!open) return;
        const handleClick = (e: MouseEvent) => {
            if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setOpen(false);
        };
        document.addEventListener('mousedown', handleClick);
        document.addEventListener('keydown', handleEsc);
        return () => {
            document.removeEventListener('mousedown', handleClick);
            document.removeEventListener('keydown', handleEsc);
        };
    }, [open]);

    useEffect(() => {
        try {
            console.log('[PostAttachmentsPopover] attachments:', attachments);
        } catch (e) {
            setError('attachments prop error: ' + String(e));
        }
    }, [attachments]);

    if (error) {
        return <div className="absolute top-0 right-0 z-50 bg-red-100 text-red-700 p-2">{error}</div>;
    }

    // Always show button for debug, even if no attachments
    return (
        <div className="absolute top-0 right-0 z-20">
            <button
                type="button"
                className="px-3 py-1 bg-yellow-100 border border-yellow-400 rounded shadow text-sm font-semibold hover:bg-red-50 hover:text-red-500 transition"
                onClick={() => setOpen(o => !o)}
            >
                첨부파일 ({attachments?.length ?? 0})
            </button>
            {open && attachments && attachments.length > 0 && (
                <div
                    ref={popoverRef}
                    className="mt-2 w-72 bg-white border border-gray-300 rounded shadow-lg p-3 space-y-2"
                >
                    {attachments.map(att => (
                        <div
                            key={att.key}
                            className="flex items-center gap-3 bg-gray-50 rounded px-2 py-1"
                        >
                            <Image
                                src={getIcon(att.type)}
                                alt="file icon"
                                width={18}
                                height={18}
                                className="shrink-0"
                            />
                            <span
                                className="flex-1 min-w-0 truncate text-xs text-gray-800"
                                title={att.name}
                            >
                                {att.name}
                            </span>
                            <a
                                href={att.url}
                                download={att.name}
                                className="px-2 py-0.5 text-xs bg-white border border-gray-300 rounded hover:bg-red-50 hover:text-red-500 transition"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                다운로드
                            </a>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default PostAttachmentsPopover;
