'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { BottomSheet, NotifyIcon, RightChevronIcon, Skeleton } from '@/app/web_view/_components';
import { useBoardList, useBoardSection, usePost } from '@/app/web_view/_query';
import { MainPageTextButton } from '@/app/web_view/Main/_components/MainPageTextButton';
import { pad } from '@/lib/delivery';
import type { ResponsePost } from '@/lib/types/post';

const monthDay = (d: Date) => `${d.getMonth() + 1}월 ${d.getDate()}일`;

function postedAt(iso: string): string {
    const d = new Date(iso);
    const day = d.toDateString() === new Date().toDateString() ? '오늘' : monthDay(d);
    return `${day} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// Article bodies are editor HTML; the sheet previews the text, the post page has the rest.
function plainText(html: string): string {
    const doc = new DOMParser().parseFromString(html.replace(/<br\s*\/?>|<\/(p|div|h\d|li)>/gi, '$&\n'), 'text/html');
    const text = (doc.body.textContent ?? '').replace(/\n{3,}/g, '\n\n').trim();
    return text.length > 600 ? `${text.slice(0, 600)}…` : text;
}

/** The 입주업체 공지 board on the 식사 home: the newest article as the 공지 banner, the next two as 신메뉴 소식. */
export function FacilityNotices() {
    const router = useRouter();
    const boards = useBoardList();
    const boardId = boards.data?.find((b) => b.slug === 'facility-notice')?.id;
    const articles = useBoardSection({ boardId, pageSize: 3 });
    const [sheetOpen, setSheetOpen] = useState(false);

    const divider = <div className="mx-5 my-5 h-px bg-[#F0F0F0]" />;
    if (boards.isPending || (boardId !== undefined && articles.isPending)) {
        return (
            <>
                {divider}
                <div className="px-5">
                    <Skeleton className="h-11 w-full rounded-[10px]" />
                </div>
            </>
        );
    }
    if (boards.isError || articles.isError) {
        return (
            <>
                {divider}
                <p className="px-5 text-[14px] text-[#BBBBBB]">입주업체 공지를 불러오지 못했어요</p>
            </>
        );
    }
    const [notice, ...news] = articles.data ?? [];
    if (!notice) return null;

    return (
        <>
            {divider}
            <div className="px-5">
                <button
                    type="button"
                    onClick={() => setSheetOpen(true)}
                    className="flex h-11 w-full items-center rounded-[10px] bg-[#FFF8E5] px-4 text-left"
                >
                    <NotifyIcon size={18} className="text-ara_red" />
                    <span className="ml-2 shrink-0 text-[14px] font-bold text-ara_red">입주업체</span>
                    <span className="ml-4 min-w-0 flex-1 truncate text-[14px] text-[#333333]">{notice.title}</span>
                </button>
            </div>

            {news.length > 0 && (
                <>
                    {divider}
                    <section>
                        <MainPageTextButton label="신메뉴 소식" onPress={() => router.push(`/web_view/Board/${boardId}`)} />
                        <div className="mt-3 space-y-3 px-5">
                            {news.map((post) => (
                                <button
                                    key={post.id}
                                    type="button"
                                    onClick={() => router.push(`/web_view/Post/${post.id}`)}
                                    className="block min-h-[128px] w-full rounded-[15px] bg-[#F6F6F6] px-[18px] pb-5 pt-[22px] text-left"
                                >
                                    <span className="line-clamp-2 break-keep text-[16px] font-semibold leading-[1.4] text-[#333333]">{post.title}</span>
                                    <span className="mt-2 block text-[13px] text-[#BBBBBB]">
                                        {post.created_by.profile.nickname} · {monthDay(new Date(post.created_at))}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </section>
                </>
            )}

            <BottomSheet open={sheetOpen} onClose={() => setSheetOpen(false)} title="식당 공지">
                <NoticeBody notice={notice} onMore={() => router.push(`/web_view/Post/${notice.id}`)} />
            </BottomSheet>
        </>
    );
}

// Mounted only while the sheet is, so the article (and its hit count) loads on open, not on every home visit.
function NoticeBody({ notice, onMore }: { notice: ResponsePost; onMore: () => void }) {
    const { data: post } = usePost({ postId: notice.id });
    const content: unknown = post?.content;

    return (
        <div className="px-5">
            <h3 className="break-keep text-[16px] font-bold text-[#222222]">{notice.title}</h3>
            <p className="mt-1 text-[12px] text-[#999999]">
                {notice.created_by.profile.nickname} · {postedAt(notice.created_at)}
            </p>
            {typeof content === 'string' ? (
                <p className="mt-4 whitespace-pre-line break-keep text-[15px] leading-[1.6] text-[#333333]">{plainText(content)}</p>
            ) : (
                <div className="mt-4 space-y-2">
                    <Skeleton className="h-[15px] w-[90%] rounded" />
                    <Skeleton className="h-[15px] w-[70%] rounded" />
                </div>
            )}
            <div className="mt-5 h-px bg-[#F0F0F0]" />
            <button type="button" onClick={onMore} className="flex w-full items-center justify-between py-4 text-left text-[14px] text-[#646464]">
                더 보기
                <RightChevronIcon size={18} />
            </button>
        </div>
    );
}
