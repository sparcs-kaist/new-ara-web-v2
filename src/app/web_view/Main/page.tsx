'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Screen } from '@/app/web_view/_components';
import { fetchTopArticles, fetchArticles } from '@/lib/api/board';
import { fetchMe } from '@/lib/api/user';
import type { ResponsePost } from '@/lib/types/post';
import { HomeHeader } from './_components/HomeHeader';
import { SectionHeader } from './_components/SectionHeader';
import { ArticleRow, ArticleRowSkeleton } from '@/app/web_view/Board/_components/ArticleRow';
import { Fab } from '@/app/web_view/Board/_components/Fab';

export default function MainPage() {
    const router = useRouter();
    const [hot, setHot] = useState<ResponsePost[] | null>(null);
    const [recent, setRecent] = useState<ResponsePost[] | null>(null);
    const [authError, setAuthError] = useState(false);

    useEffect(() => {
        let cancelled = false;

        // Auth gate: bounce to login on 401.
        fetchMe().catch((err: unknown) => {
            const status = (err as { response?: { status?: number } })?.response?.status;
            if (status === 401 && !cancelled) {
                setAuthError(true);
                router.replace('/web_view/Login');
            }
        });

        // Hot articles preview (top 5).
        fetchTopArticles({ pageSize: 5 })
            .then((res) => {
                if (!cancelled) setHot(res.results ?? []);
            })
            .catch(() => {
                if (!cancelled) setHot([]);
            });

        // Most recent articles (top 10).
        fetchArticles({ pageSize: 10, ordering: '-created_at' })
            .then((res) => {
                if (!cancelled) setRecent(res.results ?? []);
            })
            .catch(() => {
                if (!cancelled) setRecent([]);
            });

        return () => {
            cancelled = true;
        };
    }, [router]);

    if (authError) {
        return null;
    }

    return (
        <Screen>
            <HomeHeader />

            <SectionHeader title="🔥 인기 게시물" />
            <div>
                {hot === null
                    ? Array.from({ length: 3 }).map((_, i) => <ArticleRowSkeleton key={i} />)
                    : hot.length === 0
                      ? <EmptyMessage text="인기 게시물이 없습니다." />
                      : hot.map((post, idx) => (
                            <ArticleRow
                                key={post.id}
                                post={post}
                                rank={idx + 1}
                                showBoard
                            />
                        ))}
            </div>

            <SectionHeader title="최근 게시물" />
            <div>
                {recent === null
                    ? Array.from({ length: 5 }).map((_, i) => <ArticleRowSkeleton key={i} />)
                    : recent.length === 0
                      ? <EmptyMessage text="게시물이 없습니다." />
                      : recent.map((post) => (
                            <ArticleRow key={post.id} post={post} showBoard />
                        ))}
            </div>

            <Fab href="/web_view/PostWrite" aboveTabBar />
        </Screen>
    );
}

function EmptyMessage({ text }: { text: string }) {
    return (
        <div
            style={{
                padding: 'var(--ara-spacing-xl)',
                textAlign: 'center',
                color: 'var(--ara-text-tertiary)',
                fontSize: 14,
            }}
        >
            {text}
        </div>
    );
}
