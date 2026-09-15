'use client';

import { useCallback, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import {
    archivePost,
    reportPost,
    unarchivePost,
    votePost,
} from '@/lib/api/post';
import { formatPost } from '@/app/post/util/getPost';
import TextEditor from '@/components/TextEditor/TextEditor';
import type { Comment, PostData } from '@/lib/types/post';
import { AppHeader, CenteredSpinner, ComposerSpacer, ContentArea, LeftChevronIcon, Screen } from '@/app/web_view/_components';
import { useSafeBack } from '@/app/web_view/hooks/useSafeBack';
import { usePullToRefresh } from '@/app/web_view/hooks/usePullToRefresh';
import { usePost } from '@/app/web_view/_query';
import { useWindowBottomAnchoredScroll } from '@sparcs-kaist/keyboard-inset/react';
import { ArticleHeader } from './_components/ArticleHeader';
import { Attachments } from './_components/Attachments';
import { CommentComposer } from './_components/CommentComposer';
import { CommentItem } from './_components/CommentItem';
import { UtilityButtons } from './_components/UtilityButtons';
import { VoteRow } from './_components/VoteRow';

type VoteAction = 'vote_positive' | 'vote_negative' | 'vote_cancel';

export default function WebViewPostDetailPage() {
    const params = useParams();
    const router = useRouter();
    const onBack = useSafeBack();
    const idRaw = (params?.id ?? '') as string;
    const postId = Number.parseInt(idRaw, 10);

    const qc = useQueryClient();
    const [replyTarget, setReplyTarget] = useState<{ id: number; nickname: string } | null>(null);

    /**
     * Fetch via the WebView-scoped query cache. `placeholderData` looks up
     * any cached article (Board list, Main feed) with this id and uses
     * it as the initial render — the AppBar / title / author show up
     * instantly on push, then the body fills in once the detail call
     * completes. Lifts the perceived latency on Board → Post by ~200ms.
     */
    const postQuery = usePost({ postId });
    const isInvalidId = !Number.isFinite(postId) || postId <= 0;

    // The list cache holds raw `ResponsePost`s; the detail endpoint adds
    // comments + an extended payload. `formatPost` only normalizes the
    // body content shape — running it on either is safe.
    const post = postQuery.data
        ? (formatPost({ data: postQuery.data }) as unknown as PostData)
        : null;
    // `isPlaceholderData` is true while we're showing a list-cache hit
    // (title/board/author present, body+comments missing). Use it to
    // skip the bodies/comment-section so the user doesn't see an
    // incorrect "첫 댓글을 남겨보세요" flash for ~200ms.
    const isPlaceholder = postQuery.isPlaceholderData;

    const reload = useCallback(() => postQuery.refetch(), [postQuery]);

    usePullToRefresh(reload);

    // Messenger-style fold: preserve the bottom-edge content (comments above the
    // fixed composer) when the keyboard resizes the document, wherever the user is.
    useWindowBottomAnchoredScroll();

    /** Optimistic mutate of the cached post so VoteRow / scrap buttons stay snappy. */
    const patchPost = useCallback(
        (patch: (p: PostData) => PostData) => {
            qc.setQueryData<PostData>(['webview', 'post', postId], (prev) =>
                prev ? patch(prev) : prev,
            );
        },
        [qc, postId],
    );

    const handleVote = async (action: VoteAction) => {
        if (!post) return;
        const before = {
            my_vote: post.my_vote,
            pos: post.positive_vote_count,
            neg: post.negative_vote_count,
        };
        patchPost((prev) => {
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
        try {
            await votePost(post.id, action);
        } catch (e) {
            console.warn('votePost failed', e);
            patchPost((prev) => ({
                ...prev,
                my_vote: before.my_vote,
                positive_vote_count: before.pos,
                negative_vote_count: before.neg,
            }));
        }
    };

    const handleScrap = async () => {
        if (!post) return;
        try {
            if (post.my_scrap) {
                const scrapId = post.my_scrap.id;
                patchPost((prev) => ({ ...prev, my_scrap: null }));
                await unarchivePost(scrapId);
            } else {
                const created = await archivePost(post.id);
                patchPost((prev) => ({ ...prev, my_scrap: created }));
            }
        } catch (e) {
            console.warn('scrap failed', e);
            // Fall back to authoritative state.
            reload();
        }
    };

    const handleShare = async () => {
        const url = typeof window !== 'undefined' ? window.location.href : '';
        try {
            if (typeof navigator !== 'undefined' && navigator.share) {
                await navigator.share({ url });
                return;
            }
            if (typeof navigator !== 'undefined' && navigator.clipboard) {
                await navigator.clipboard.writeText(url);
            }
        } catch {
            /* noop */
        }
    };

    const handleReport = async () => {
        if (!post) return;
        if (typeof window === 'undefined') return;
        const reason = window.prompt('신고 사유를 입력하세요');
        if (!reason) return;
        try {
            await reportPost(post.id, 'others', reason);
            window.alert('신고가 접수되었습니다.');
        } catch (e) {
            console.warn('reportPost failed', e);
        }
    };

    const handleEdit = () => {
        if (!post) return;
        router.push(`/web_view/PostWrite?edit=${post.id}`);
    };

    const handleDelete = async () => {
        if (!post) return;
        if (typeof window !== 'undefined' && !window.confirm('정말 삭제하시겠어요?')) return;
        try {
            const { deletePost } = await import('@/lib/api/post');
            await deletePost(post.id);
            onBack();
        } catch (e) {
            console.warn('deletePost failed', e);
        }
    };

    if (isInvalidId) {
        return (
            <Screen withTabBar={false}>
                <AppHeader title={null} />
                <div className="px-6 py-16 text-center text-[14px] text-[#B1B1B1]">
                    잘못된 게시물 주소입니다.
                </div>
            </Screen>
        );
    }

    if (!post && postQuery.isPending) {
        return (
            <Screen withTabBar={false}>
                <AppHeader title={null} />
                <CenteredSpinner />
            </Screen>
        );
    }

    if (!post && postQuery.isError) {
        return (
            <Screen withTabBar={false}>
                <AppHeader title={null} />
                <div className="px-6 py-16 text-center text-[14px] text-[#B1B1B1]">
                    게시물을 불러오지 못했습니다.
                </div>
            </Screen>
        );
    }

    if (!post) return null;

    const boardName = post.parent_board?.ko_name ?? '';
    const isAnonymousPost = post.name_type === 2;
    const isBlockedAuthor = !!post.created_by?.is_blocked;
    const totalCommentCount = countComments(post.comments ?? []);

    // Faithful Flutter AppBar: red chevron + small red board name on the left.
    const leading = (
        <button
            type="button"
            onClick={onBack}
            className="flex items-center text-ara_red"
            aria-label="뒤로"
        >
            <LeftChevronIcon size={32} />
            <span className="ml-1 text-[17px] font-medium text-ara_red">{boardName}</span>
        </button>
    );

    return (
        <Screen withTabBar={false}>
            <AppHeader title={null} leading={leading} />

            <ArticleHeader post={post} />

            {/* Article body — anchor clicks are intercepted so external URLs
                open via the bridge instead of replacing the WebView. */}
            <ContentArea className="px-5 pt-[10px] text-[15px] leading-relaxed text-black">
                {isPlaceholder ? (
                    <CenteredSpinner padY={40} size={28} />
                ) : (
                    <TextEditor content={post.content} editable={false} />
                )}
            </ContentArea>

            {!isPlaceholder && post.attachments && post.attachments.length > 0 && (
                <div className="pt-3">
                    <Attachments attachments={post.attachments} />
                </div>
            )}

            <VoteRow
                myVote={post.my_vote}
                positive={post.positive_vote_count}
                negative={post.negative_vote_count}
                onVote={handleVote}
            />

            <UtilityButtons
                isMine={!!post.is_mine}
                isScrapped={!!post.my_scrap}
                isBlockedAuthor={isBlockedAuthor}
                nameType={post.name_type}
                onScrap={handleScrap}
                onShare={handleShare}
                onReport={handleReport}
                onEdit={handleEdit}
                onDelete={handleDelete}
            />

            {/* Divider before comment section. */}
            <div className="mx-5 mt-[15px] h-px bg-[#F0F0F0]" />

            <h3 className="px-5 pt-[15px] pb-[15px] text-[16px] font-bold text-black">
                {isPlaceholder ? '댓글' : `${totalCommentCount}개의 댓글`}
            </h3>

            <section>
                {isPlaceholder ? null : post.comments && post.comments.length > 0 ? (
                    post.comments.map((c) => (
                        <CommentItem
                            key={c.id}
                            comment={c}
                            isAuthor={
                                isAnonymousPost &&
                                c.created_by?.id === post.created_by?.id
                            }
                            onReply={(id) =>
                                setReplyTarget({
                                    id,
                                    nickname:
                                        c.name_type === 2
                                            ? '익명'
                                            : c.created_by?.profile?.nickname ?? '',
                                })
                            }
                            onChanged={reload}
                        />
                    ))
                ) : (
                    <div className="px-6 py-16 text-center text-[14px] text-[#B1B1B1]">
                        첫 댓글을 남겨보세요.
                    </div>
                )}
            </section>

            {/* Reserve space so the last comment doesn't sit under the
                composer — sized from the composer's measured height, since
                a reply header or a five-line draft grows well past 96px. */}
            <ComposerSpacer height={96} />

            <CommentComposer
                postId={post.id}
                allowedNameTypes={post.name_type}
                replyToCommentId={replyTarget?.id ?? null}
                replyToNickname={replyTarget?.nickname ?? null}
                onCancelReply={() => setReplyTarget(null)}
                onPosted={() => {
                    setReplyTarget(null);
                    reload();
                }}
            />
        </Screen>
    );
}

/** Total comments + nested replies. */
function countComments(comments: Comment[]): number {
    let n = comments.length;
    for (const c of comments) n += c.comments?.length ?? 0;
    return n;
}
