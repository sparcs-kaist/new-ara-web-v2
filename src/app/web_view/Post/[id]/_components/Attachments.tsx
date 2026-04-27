'use client';

import { ClipBadgeIcon } from '@/app/web_view/_components';

type RawAttachment = {
    id: number;
    file: string;
    mimetype: string;
    size?: number;
};

interface AttachmentsProps {
    attachments: RawAttachment[];
}

const isImage = (mimetype: string) => mimetype?.startsWith('image');

/**
 * Inline images at full width and a simple file row per non-image
 * attachment. Mirrors the AttachPopupMenuButton layout in Flutter but
 * without the popup — clicking a file opens it in a new tab.
 */
export function Attachments({ attachments }: AttachmentsProps) {
    if (!attachments?.length) return null;

    const images = attachments.filter((a) => isImage(a.mimetype));
    const files = attachments.filter((a) => !isImage(a.mimetype));

    return (
        <div className="flex flex-col gap-3 px-5">
            {images.map((img) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                    key={img.id}
                    src={img.file}
                    alt=""
                    className="w-full rounded-[10px] object-contain"
                />
            ))}
            {files.length > 0 && (
                <ul className="flex list-none flex-col gap-2 p-0">
                    {files.map((f) => {
                        const name = f.file.split('/').pop() ?? 'attachment';
                        return (
                            <li key={f.id}>
                                <a
                                    href={f.file}
                                    target="_blank"
                                    rel="noreferrer noopener"
                                    className="flex items-center gap-[10px] rounded-[10px] border border-[#F0F0F0] bg-[#FAFAFA] p-3 text-[13px] text-black"
                                >
                                    <span className="shrink-0 text-[#666666]">
                                        <ClipBadgeIcon size={16} />
                                    </span>
                                    <span className="min-w-0 flex-1 truncate" title={name}>
                                        {name}
                                    </span>
                                    <span className="shrink-0 text-[12px] text-[#9E9E9E]">다운로드</span>
                                </a>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}
