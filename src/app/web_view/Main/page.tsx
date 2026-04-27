'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Screen, LittleText } from '@/app/web_view/_components';
import { fetchArticles, fetchBoardList, fetchTopArticles } from '@/lib/api/board';
import { fetchMe } from '@/lib/api/user';
import type { ResponsePost } from '@/lib/types/post';
import { HomeAppBar } from './_components/HomeAppBar';
import { MainPageTextButton } from './_components/MainPageTextButton';
import { PopularBoardRow } from './_components/PopularBoardRow';
import { SectionBox, HairlineDivider } from './_components/SectionBox';
import { NoticeRow } from './_components/NoticeRow';

interface BoardItem {
    id: number;
    slug: string;
    ko_name: string;
    en_name?: string;
    group?: { id: number; slug: string; ko_name: string } | null;
    topics?: Array<{ id: number; slug: string; ko_name: string }>;
}

interface Sections {
    top: ResponsePost[];
    talks: ResponsePost[];
    portal: ResponsePost[];
    facility: ResponsePost[];
    ara: ResponsePost[];
    realEstate: ResponsePost[];
    market: ResponsePost[];
    wanted: ResponsePost[];
    grad: ResponsePost[];
    undergrad: ResponsePost[];
    freshman: ResponsePost[];
}

const EMPTY: Sections = {
    top: [],
    talks: [],
    portal: [],
    facility: [],
    ara: [],
    realEstate: [],
    market: [],
    wanted: [],
    grad: [],
    undergrad: [],
    freshman: [],
};

/** Find a board id from a slug (and optionally a topic slug) in the board list. */
function lookupBoard(boards: BoardItem[], slug: string, topicSlug = ''): { boardId?: number; topicId?: number; board?: BoardItem } {
    const board = boards.find((b) => b.slug === slug);
    if (!board) return {};
    if (!topicSlug) return { boardId: board.id, board };
    const topic = board.topics?.find((t) => t.slug === topicSlug);
    return { boardId: board.id, topicId: topic?.id, board };
}

export default function MainPage() {
    const router = useRouter();
    const [authError, setAuthError] = useState(false);
    const [boards, setBoards] = useState<BoardItem[]>([]);
    const [data, setData] = useState<Sections>(EMPTY);

    useEffect(() => {
        let cancelled = false;
        // Auth gate.
        fetchMe().catch((err: unknown) => {
            const status = (err as { response?: { status?: number } })?.response?.status;
            if (status === 401 && !cancelled) {
                setAuthError(true);
                router.replace('/web_view/Login');
            }
        });

        (async () => {
            try {
                const [boardListRes, topRes] = await Promise.all([
                    fetchBoardList(),
                    fetchTopArticles({ pageSize: 3 }),
                ]);
                if (cancelled) return;
                const boardList: BoardItem[] = Array.isArray(boardListRes) ? boardListRes : (boardListRes?.results ?? []);
                setBoards(boardList);

                const fetchSection = async (slug: string, topicSlug = '') => {
                    const { boardId, topicId } = lookupBoard(boardList, slug, topicSlug);
                    if (!boardId) return [] as ResponsePost[];
                    const res = await fetchArticles({ boardId, topicId, pageSize: 3 });
                    return (res?.results ?? []) as ResponsePost[];
                };

                const [
                    talks,
                    portal,
                    facility,
                    ara,
                    realEstate,
                    market,
                    wanted,
                    grad,
                    undergrad,
                    freshman,
                ] = await Promise.all([
                    fetchSection('talk'),
                    fetchSection('portal-notice'),
                    fetchSection('facility-notice'),
                    fetchSection('ara-notice'),
                    fetchSection('real-estate'),
                    fetchSection('market'),
                    fetchSection('wanted'),
                    fetchSection('students-group', 'grad-assoc'),
                    fetchSection('students-group', 'undergrad-assoc'),
                    fetchSection('students-group', 'freshman-council'),
                ]);

                if (cancelled) return;
                setData({
                    top: (topRes?.results ?? []) as ResponsePost[],
                    talks,
                    portal,
                    facility,
                    ara,
                    realEstate,
                    market,
                    wanted,
                    grad,
                    undergrad,
                    freshman,
                });
            } catch (e) {
                console.warn('Main page load failed', e);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [router]);

    const goBoard = (slug: string) => {
        const board = boards.find((b) => b.slug === slug);
        if (board) router.push(`/web_view/Board/${board.slug}`);
    };
    const goPost = (id: number) => router.push(`/web_view/Post/${id}`);

    const top = data.top;
    const talks = data.talks;

    const tradeFirst = useMemo(() => ({
        realEstate: data.realEstate[0] ?? null,
        market: data.market[0] ?? null,
        wanted: data.wanted[0] ?? null,
    }), [data]);

    if (authError) return null;

    return (
        <Screen>
            <HomeAppBar />

            {/* 실시간 인기 */}
            <section className="pt-2">
                <MainPageTextButton label="실시간 인기글" onPress={() => router.push('/web_view/Board/_top')} />
                <div className="px-5">
                    {[0, 1, 2].map((i) => {
                        const post = top[i];
                        if (!post) return null;
                        return (
                            <div key={post.id}>
                                <PopularBoardRow post={post} rank={i + 1} />
                                {i < 2 && top[i + 1] && (
                                    <div className="flex">
                                        <div className="w-[28px]" />
                                        <div className="h-px flex-1 bg-[#F0F0F0]" />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </section>

            <div className="h-5" />

            {/* 자유게시판 */}
            <section>
                <MainPageTextButton label="자유게시판" onPress={() => goBoard('talk')} />
                <div className="px-5">
                    {[0, 1, 2].map((i) => {
                        const post = talks[i];
                        if (!post) return null;
                        return (
                            <div key={post.id}>
                                <PopularBoardRow post={post} />
                                {i < 2 && talks[i + 1] && <HairlineDivider />}
                            </div>
                        );
                    })}
                </div>
            </section>

            <div className="h-5" />

            {/* 공지 */}
            <section>
                <h2 className="px-5 pb-[9px] text-[20px] font-semibold text-black">공지</h2>
                <SectionBox>
                    <NoticeRow
                        label="포탈 공지"
                        color="#1F4899"
                        leading={<KaistMark />}
                        onLabelTap={() => goBoard('portal-notice')}
                    />
                    <div className="h-[10px]" />
                    {data.portal[0] && (
                        <>
                            <button type="button" onClick={() => goPost(data.portal[0].id)} className="block w-full bg-transparent text-left">
                                <LittleText post={data.portal[0]} />
                            </button>
                            <div className="h-[10px]" />
                        </>
                    )}
                    {data.portal[1] && (
                        <>
                            <button type="button" onClick={() => goPost(data.portal[1].id)} className="block w-full bg-transparent text-left">
                                <LittleText post={data.portal[1]} />
                            </button>
                            <div className="h-[10px]" />
                        </>
                    )}
                    {data.portal[2] && (
                        <>
                            <button type="button" onClick={() => goPost(data.portal[2].id)} className="block w-full bg-transparent text-left">
                                <LittleText post={data.portal[2]} />
                            </button>
                        </>
                    )}
                    <div className="h-[14px]" />
                    <HairlineDivider />
                    <div className="h-[14px]" />
                    <NoticeRow
                        label="입주 업체"
                        color="#646464"
                        onLabelTap={() => goBoard('facility-notice')}
                        post={data.facility[0] ?? null}
                        onPostTap={() => data.facility[0] && goPost(data.facility[0].id)}
                    />
                    <div className="h-[10px]" />
                    <NoticeRow
                        label="Ara 운영진"
                        color="#ED3A3A"
                        onLabelTap={() => goBoard('ara-notice')}
                        post={data.ara[0] ?? null}
                        onPostTap={() => data.ara[0] && goPost(data.ara[0].id)}
                    />
                </SectionBox>
            </section>

            <div className="h-5" />

            {/* 거래 */}
            <section>
                <h2 className="px-5 pb-[9px] text-[20px] font-semibold text-black">거래</h2>
                <SectionBox>
                    <NoticeRow
                        label="부동산"
                        color="#4A90E2"
                        onLabelTap={() => goBoard('real-estate')}
                        post={tradeFirst.realEstate}
                        showTopic
                    />
                    <div className="h-[10px]" />
                    <NoticeRow
                        label="중고거래"
                        color="#646464"
                        onLabelTap={() => goBoard('market')}
                        post={tradeFirst.market}
                        showTopic
                    />
                    <div className="h-[10px]" />
                    <NoticeRow
                        label="구인구직"
                        color="#ED3A3A"
                        onLabelTap={() => goBoard('wanted')}
                        post={tradeFirst.wanted}
                        showTopic
                    />
                </SectionBox>
            </section>

            <div className="h-5" />

            {/* 학생 단체 */}
            <section>
                <MainPageTextButton label="학생 단체" onPress={() => goBoard('students-group')} />
                <div className="h-[9px]" />
                <SectionBox>
                    <StudentRow label="원총" post={data.grad[0] ?? null} onTap={() => data.grad[0] && goPost(data.grad[0].id)} />
                    <div className="h-[10px]" />
                    <StudentRow label="총학" post={data.undergrad[0] ?? null} onTap={() => data.undergrad[0] && goPost(data.undergrad[0].id)} />
                    <div className="h-[10px]" />
                    <StudentRow label="새학" post={data.freshman[0] ?? null} onTap={() => data.freshman[0] && goPost(data.freshman[0].id)} />
                </SectionBox>
            </section>

            <div className="h-5" />
        </Screen>
    );
}

function StudentRow({ label, post, onTap }: { label: string; post: ResponsePost | null; onTap?: () => void }) {
    return (
        <div className="flex items-center gap-[10px]">
            <span className="shrink-0 text-[14px] font-bold text-[#B1B1B1]">{label}</span>
            {post && (
                <button type="button" onClick={onTap} className="min-w-0 flex-1 bg-transparent text-left">
                    <LittleText post={post} />
                </button>
            )}
        </div>
    );
}

/** Real KAIST monogram (`assets/icons/kaist.png` → `/webview/icons/kaist.png`). */
function KaistMark() {
    return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
            src="/webview/icons/kaist.png"
            alt="KAIST"
            width={19}
            height={19}
            className="h-[19px] w-[19px] object-cover"
            draggable={false}
        />
    );
}
