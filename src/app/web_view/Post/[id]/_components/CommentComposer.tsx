'use client';

import { useEffect, useRef, useState } from 'react';
import http from '@/lib/api/http';
import { bridge } from '@/app/web_view/_bridge';
import { StickyComposer } from '@/app/web_view/_components';

interface CommentComposerProps {
    postId: number;
    /** Bitmask: 1 = nickname allowed, 2 = anonymous allowed. */
    allowedNameTypes: number;
    /** When set, posts a reply to this comment id. */
    replyToCommentId?: number | null;
    onCancelReply?: () => void;
    onPosted?: () => void;
}

const MAX_LINE_HEIGHT_PX = 22; // matches font-size 14 with 1.5 line-height
const MAX_LINES = 5;

/**
 * Sticky bottom comment composer. Auto-grows up to 5 lines and rides above
 * the software keyboard via StickyComposer's `--ara-keyboard-height`.
 */
export function CommentComposer({
    postId,
    allowedNameTypes,
    replyToCommentId,
    onCancelReply,
    onPosted,
}: CommentComposerProps) {
    const canNickname = (allowedNameTypes & 1) > 0;
    const canAnonymous = (allowedNameTypes & 2) > 0;

    const [text, setText] = useState('');
    const [anonymous, setAnonymous] = useState<boolean>(canAnonymous && !canNickname);
    const [submitting, setSubmitting] = useState(false);
    const taRef = useRef<HTMLTextAreaElement>(null);

    // Auto-grow up to MAX_LINES.
    useEffect(() => {
        const el = taRef.current;
        if (!el) return;
        el.style.height = 'auto';
        const max = MAX_LINE_HEIGHT_PX * MAX_LINES + 16; // + vertical padding
        el.style.height = `${Math.min(el.scrollHeight, max)}px`;
        el.style.overflowY = el.scrollHeight > max ? 'auto' : 'hidden';
    }, [text]);

    const showAnonymousToggle = canNickname && canAnonymous;
    const disabled = !text.trim() || submitting;

    const submit = async () => {
        if (disabled) return;
        try {
            bridge?.send('haptic', { kind: 'light' });
        } catch {
            /* noop */
        }
        setSubmitting(true);
        try {
            const nameType = anonymous ? 2 : 1;
            const body: Record<string, unknown> = {
                content: text,
                name_type: nameType,
                attachment: null,
            };
            if (replyToCommentId) body.parent_comment = replyToCommentId;
            else body.parent_article = postId;
            await http.post('comments/', body);
            setText('');
            taRef.current?.blur();
            onPosted?.();
        } catch (e) {
            console.error('createComment failed', e);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <StickyComposer aboveTabBar={false}>
            {replyToCommentId && (
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '6px 12px 0',
                        fontSize: 12,
                        color: 'var(--ara-text-tertiary)',
                    }}
                >
                    <span>답글 작성 중</span>
                    {onCancelReply && (
                        <button
                            type="button"
                            onClick={onCancelReply}
                            style={{
                                background: 'transparent',
                                border: 0,
                                color: 'var(--ara-text-secondary)',
                                fontSize: 12,
                                cursor: 'pointer',
                                padding: 0,
                            }}
                        >
                            취소
                        </button>
                    )}
                </div>
            )}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'flex-end',
                    gap: 8,
                    padding: '8px 12px',
                }}
            >
                {showAnonymousToggle && (
                    <button
                        type="button"
                        role="switch"
                        aria-checked={anonymous}
                        onClick={() => setAnonymous((v) => !v)}
                        style={{
                            flexShrink: 0,
                            height: 32,
                            padding: '0 10px',
                            borderRadius: 999,
                            border: `1px solid ${anonymous ? 'var(--ara-primary)' : 'var(--ara-divider-strong)'}`,
                            background: anonymous ? 'var(--ara-primary-bright)' : 'transparent',
                            color: anonymous ? 'var(--ara-primary)' : 'var(--ara-text-secondary)',
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: 'pointer',
                        }}
                    >
                        익명
                    </button>
                )}
                <textarea
                    ref={taRef}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="댓글을 입력하세요"
                    rows={1}
                    inputMode="text"
                    autoCapitalize="sentences"
                    style={{
                        flex: 1,
                        minHeight: 36,
                        maxHeight: MAX_LINE_HEIGHT_PX * MAX_LINES + 16,
                        padding: '8px 12px',
                        borderRadius: 18,
                        border: '1px solid var(--ara-divider-strong)',
                        background: 'var(--ara-bg-muted)',
                        fontSize: 14,
                        lineHeight: '22px',
                        color: 'var(--ara-text-primary)',
                        resize: 'none',
                        outline: 'none',
                        fontFamily: 'inherit',
                    }}
                />
                <button
                    type="button"
                    onClick={submit}
                    disabled={disabled}
                    style={{
                        flexShrink: 0,
                        height: 36,
                        padding: '0 14px',
                        borderRadius: 18,
                        border: 0,
                        background: disabled ? 'var(--ara-divider-strong)' : 'var(--ara-primary)',
                        color: '#fff',
                        fontSize: 14,
                        fontWeight: 600,
                        cursor: disabled ? 'not-allowed' : 'pointer',
                    }}
                >
                    전송
                </button>
            </div>
        </StickyComposer>
    );
}
