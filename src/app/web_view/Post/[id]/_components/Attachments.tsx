'use client';

import { bridge } from '@/app/web_view/_bridge';

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
 * Renders inline images and a download card per non-image attachment.
 * Uses the bridge `openExternal` for downloads when available; otherwise
 * just opens in a new tab.
 */
export function Attachments({ attachments }: AttachmentsProps) {
    if (!attachments?.length) return null;

    const images = attachments.filter((a) => isImage(a.mimetype));
    const files = attachments.filter((a) => !isImage(a.mimetype));

    const open = (url: string) => {
        try {
            bridge?.send('openExternal', { url });
        } catch {
            if (typeof window !== 'undefined') window.open(url, '_blank');
        }
    };

    return (
        <div style={{ padding: '0 var(--ara-spacing-lg)', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {images.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {images.map((img) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            key={img.id}
                            src={img.file}
                            alt=""
                            style={{
                                width: '100%',
                                borderRadius: 'var(--ara-radius-md)',
                                objectFit: 'contain',
                            }}
                        />
                    ))}
                </div>
            )}

            {files.length > 0 && (
                <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {files.map((f) => {
                        const name = f.file.split('/').pop() ?? 'attachment';
                        return (
                            <li
                                key={f.id}
                                onClick={() => open(f.file)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 10,
                                    padding: 12,
                                    border: '1px solid var(--ara-divider)',
                                    borderRadius: 'var(--ara-radius-md)',
                                    background: 'var(--ara-bg-muted)',
                                    cursor: 'pointer',
                                }}
                            >
                                <span aria-hidden style={{ fontSize: 18 }}>📎</span>
                                <span
                                    style={{
                                        flex: 1,
                                        fontSize: 13,
                                        color: 'var(--ara-text-primary)',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                    }}
                                    title={name}
                                >
                                    {name}
                                </span>
                                <span style={{ fontSize: 12, color: 'var(--ara-text-tertiary)' }}>다운로드</span>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}
