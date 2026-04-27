'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { fetchPost, votePost } from '@/lib/api/post';
import { formatPost } from '@/app/post/util/getPost';
import TextEditor from '@/components/TextEditor/TextEditor';
import type { PostData } from '@/lib/types/post';
import { Screen, AppHeader, ComposerSpacer } from '@/app/web_view/_components';
import { MoreButton } from './_components/MoreButton';
import { ArticleHeader } from './_components/ArticleHeader';
import { VoteRow } from './_components/VoteRow';
import { Attachments } from './_components/Attachments';
import { CommentItem } from './_components/CommentItem';
import { CommentComposer } from './_components/CommentComposer';
import { apiUrl } from '@/lib/api/http';

type VoteAction = 'vote_positive' | 'vote_negative' | 'vote_cancel';

export default function WebViewPostDetailPage() {
    const params = useParams();
    const router = useRouter();
    const idRaw = (params?.id ?? '') as string;
    const postId = Number.parseInt(idRaw, 10);

    const [post, setPost] = useState<PostData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [replyTarget, setReplyTarget] = useState<number | null>(null);

    const load = useCallback(async () => {
        if (!Number.isFinite(postId) || postId <= 0) {
            setError('잘못된 게시물 주소입니다.');
            setLoading(false);
            return;
        }
        try {
            const data = await fetchPost({
                postId,
                fromView: 'all',
                current: 3,
                overrideHidden: true,
            });
            setPost(formatPost({ data }) as unknown as PostData);
            setError(null);
        } catch (e) {
            console.error('fetchPost failed', e);
            setError('게시물을 불러오지 못했습니다.');
        } finally {
            setLoading(false);
        }
    }, [postId]);

    useEffect(() => {
        load();
    }, [load]);

    const applyVote = (action: VoteAction) => {
        setPost((prev) => {
            if (!prev) return prev;
            let pos = prev.positive_vote_count;
            let neg = prev.negative_vote_count;
            let next: boolean | null = prev.my_vote;
            if (action === 'vote_positive') {
                next = true;
                pos += 1;
                if (prev.my_vote === false) neg -= 1;
            } else if (action === 'vote_negative') {
                next = false;
                neg += 1;
                if (prev.my_vote === true) pos -= 1;
            } else {
                if (prev.my_vote === true) pos -= 1;
                if (prev.my_vote === false) neg -= 1;
                next = null;
            }
            return { ...prev, my_vote: next, positive_vote_count: pos, negative_vote_count: neg };
        });
    };

    const handleVote = async (action: VoteAction) => {
        if (!post) return;
        const before = {
            my_vote: post.my_vote,
            pos: post.positive_vote_count,
            neg: post.negative_vote_count,
        };
        applyVote(action);
        try {
            await votePost(post.id, action);
        } catch (e) {
            console.error('votePost failed', e);
            setPost((prev) =>
                prev
                    ? {
                          ...prev,
                          my_vote: before.my_vote,
                          positive_vote_count: before.pos,
                          negative_vote_count: before.neg,
                      }
                    : prev,
            );
        }
    };

    const shareUrl =
        typeof window !== 'undefined'
            ? `${apiUrl}/post/${postId}`
            : `/post/${postId}`;

    return (
        <Screen withTabBar={false}>
            <AppHeader
                title=""
                trailing={
                    <MoreButton
                        shareUrl={shareUrl}
                        onReport={() => console.log('[Post] report stub')}
                        onBlock={() => console.log('[Post] block stub')}
                    />
                }
            />

            {loading && (
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 40,
                    }}
                >
                    <div className="ara-skeleton" style={{ width: '100%', height: 200 }} />
                </div>
            )}

            {!loading && error && (
                <div style={{ padding: 24, textAlign: 'center', color: 'var(--ara-text-tertiary)' }}>
                    {error}
                    <div style={{ marginTop: 12 }}>
                        <button
                            type="button"
                            onClick={() => router.back()}
                            style={{
                                padding: '8px 16px',
                                borderRadius: 999,
                                border: '1px solid var(--ara-divider-strong)',
                                background: 'transparent',
                                cursor: 'pointer',
                            }}
                        >
                            뒤로
                        </button>
                    </div>
                </div>
            )}

            {!loading && !error && post && (
                <>
                    <ArticleHeader post={post} />

                    <section
                        style={{
                            padding: '16px var(--ara-spacing-lg)',
                            fontSize: 15,
                            lineHeight: 1.6,
                            color: 'var(--ara-text-primary)',
                        }}
                    >
                        <TextEditor content={post.content} editable={false} />
                    </section>

                    {post.attachments && post.attachments.length > 0 && (
                        <Attachments attachments={post.attachments} />
                    )}

                    <VoteRow
                        myVote={post.my_vote}
                        positive={post.positive_vote_count}
                        negative={post.negative_vote_count}
                        onVote={handleVote}
                    />

                    <section style={{ borderTop: '1px solid var(--ara-divider)' }}>
                        <header
                            style={{
                                padding: '12px var(--ara-spacing-lg)',
                                fontSize: 14,
                                fontWeight: 600,
                                color: 'var(--ara-text-primary)',
                            }}
                        >
                            댓글 {post.comments?.length ?? 0}개
                        </header>
                        {post.comments && post.comments.length > 0 ? (
                            post.comments.map((c) => (
                                <CommentItem
                                    key={c.id}
                                    comment={c}
                                    onReply={(id) => setReplyTarget(id)}
                                    onChanged={load}
                                />
                            ))
                        ) : (
                            <div
                                style={{
                                    padding: 24,
                                    textAlign: 'center',
                                    color: 'var(--ara-text-tertiary)',
                                    fontSize: 13,
                                }}
                            >
                                첫 댓글을 남겨보세요.
                            </div>
                        )}
                    </section>

                    <ComposerSpacer height={80} />

                    <CommentComposer
                        postId={post.id}
                        allowedNameTypes={post.name_type}
                        replyToCommentId={replyTarget}
                        onCancelReply={() => setReplyTarget(null)}
                        onPosted={() => {
                            setReplyTarget(null);
                            load();
                        }}
                    />
                </>
            )}
        </Screen>
    );
}
