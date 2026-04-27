'use client';

import { useEffect, useRef, useState } from 'react';
import http from '@/lib/api/http';
import { CloseIcon, SendIcon, StickyComposer } from '@/app/web_view/_components';

interface CommentComposerProps {
    postId: number;
    /** Bitmask: 1 = nickname allowed, 2 = anonymous allowed. */
    allowedNameTypes: number;
    /** When set, posts a reply to this comment id. */
    replyToCommentId?: number | null;
    /** Nickname of the comment we're replying to (for the "X님께 답글" hint). */
    replyToNickname?: string | null;
    /** Comment content currently being edited (when in modify mode). */
    editingContent?: string | null;
    /** When set, the composer is in "modify my comment" mode. */
    editingCommentId?: number | null;
    onCancelReply?: () => void;
    onPosted?: () => void;
}

const LINE_HEIGHT_PX = 22;
const MAX_LINES = 5;

/**
 * Faithful port of `_buildCommentTextFormField` in `post_view_page.dart`.
 *
 *   ┌──────────────────────────────────────────────┐
 *   │ {hint when replying / editing}               │
 *   │ [×]  ┌────────────────────────────┐  ▶       │
 *   │      │ #f8f8f8 rounded-10 input   │ send 30  │
 *   └──────────────────────────────────────────────┘
 *
 * Lifts above the keyboard via `StickyComposer`'s `--ara-keyboard-height`.
 */
export function CommentComposer({
    postId,
    allowedNameTypes,
    replyToCommentId,
    replyToNickname,
    editingContent,
    editingCommentId,
    onCancelReply,
    onPosted,
}: CommentComposerProps) {
    const canNickname = (allowedNameTypes & 1) > 0;
    const canAnonymous = (allowedNameTypes & 2) > 0;

    const [text, setText] = useState('');
    const [anonymous, setAnonymous] = useState<boolean>(canAnonymous && !canNickname);
    const [submitting, setSubmitting] = useState(false);
    const taRef = useRef<HTMLTextAreaElement>(null);

    // Pre-fill with the comment we're editing.
    useEffect(() => {
        if (editingCommentId && editingContent != null) setText(editingContent);
    }, [editingCommentId, editingContent]);

    // Auto-grow up to MAX_LINES.
    useEffect(() => {
        const el = taRef.current;
        if (!el) return;
        el.style.height = 'auto';
        const max = LINE_HEIGHT_PX * MAX_LINES + 16;
        el.style.height = `${Math.min(el.scrollHeight, max)}px`;
        el.style.overflowY = el.scrollHeight > max ? 'auto' : 'hidden';
    }, [text]);

    const showAnonymousToggle = canNickname && canAnonymous;
    const inEditOrReply = !!replyToCommentId || !!editingCommentId;
    const disabled = !text.trim() || submitting;

    const submit = async () => {
        if (disabled) return;
        setSubmitting(true);
        try {
            const nameType = anonymous ? 2 : 1;
            if (editingCommentId) {
                await http.patch(`comments/${editingCommentId}/`, {
                    content: text,
                    is_mine: true,
                    name_type: nameType,
                });
            } else {
                const body: Record<string, unknown> = {
                    content: text,
                    name_type: nameType,
                    attachment: null,
                };
                if (replyToCommentId) body.parent_comment = replyToCommentId;
                else body.parent_article = postId;
                await http.post('comments/', body);
            }
            setText('');
            taRef.current?.blur();
            onPosted?.();
        } catch (e) {
            console.warn('createComment failed', e);
        } finally {
            setSubmitting(false);
        }
    };

    const headerLabel = editingCommentId
        ? `나의 댓글 "${editingContent ?? ''}" 수정 중`
        : replyToCommentId
          ? `'${replyToNickname ?? ''}'님께 답글을 작성하는 중`
          : '';

    return (
        <StickyComposer aboveTabBar={false}>
            <div className="px-5 pt-[7px] pb-2">
                {inEditOrReply && (
                    <div className="truncate pb-1 text-[13px] font-medium text-black">
                        {headerLabel}
                    </div>
                )}

                <div className="flex items-end">
                    {inEditOrReply && (
                        <button
                            type="button"
                            onClick={onCancelReply}
                            aria-label="취소"
                            className="mr-2 flex h-[30px] w-[30px] items-center justify-center bg-transparent text-ara_red"
                        >
                            <CloseIcon size={22} />
                        </button>
                    )}

                    <div className="min-h-[36px] flex-1 rounded-[10px] bg-[#F8F8F8] px-3 py-[7px]">
                        {showAnonymousToggle && !inEditOrReply && (
                            <div className="mb-1 flex items-center">
                                <button
                                    type="button"
                                    role="switch"
                                    aria-checked={anonymous}
                                    onClick={() => setAnonymous((v) => !v)}
                                    className={[
                                        'h-6 rounded-full px-2 text-[12px] font-medium',
                                        anonymous
                                            ? 'bg-ara_red_most_bright text-ara_red'
                                            : 'bg-transparent text-[#9E9E9E]',
                                    ].join(' ')}
                                >
                                    익명
                                </button>
                            </div>
                        )}
                        <textarea
                            ref={taRef}
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            placeholder="댓글을 입력하세요"
                            rows={1}
                            inputMode="text"
                            autoCapitalize="sentences"
                            className="block w-full resize-none border-0 bg-transparent text-[14px] leading-[22px] text-black placeholder:text-[#BBBBBB] focus:outline-none"
                        />
                    </div>

                    <button
                        type="button"
                        onClick={submit}
                        disabled={disabled}
                        aria-label="전송"
                        className={[
                            'ml-3 flex h-[30px] w-[30px] shrink-0 items-center justify-center bg-transparent',
                            disabled ? 'text-[#BBBBBB]' : 'text-ara_red',
                        ].join(' ')}
                    >
                        <SendIcon size={28} />
                    </button>
                </div>
            </div>
        </StickyComposer>
    );
}
