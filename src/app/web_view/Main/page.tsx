'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Screen, LittleText } from '@/app/web_view/_components';
import { fetchMe } from '@/lib/api/user';
import type { ResponsePost } from '@/lib/types/post';
import { useBoardList, useBoardSection, useTopArticles } from '@/app/web_view/_query';
import { usePullToRefresh } from '@/app/web_view/hooks/usePullToRefresh';
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

/** Pick the board id (and a topic id, if requested) for a known slug. */
function lookupBoard(
    boards: BoardItem[] | undefined,
    slug: string,
    topicSlug = '',
): { boardId?: number; topicId?: number } {
    if (!boards) return {};
    const board = boards.find((b) => b.slug === slug);
    if (!board) return {};
    if (!topicSlug) return { boardId: board.id };
    const topic = board.topics?.find((t) => t.slug === topicSlug);
    return { boardId: board.id, topicId: topic?.id };
}

export default function MainPage() {
    const router = useRouter();
    const [authError, setAuthError] = useState(false);

    // 401 gate. We only need the success/failure of the call, not the body —
    // so this stays outside react-query and just runs once.
    useEffect(() => {
        let cancelled = false;
        fetchMe().catch((err: unknown) => {
            const status = (err as { response?: { status?: number } })?.response?.status;
            if (status === 401 && !cancelled) {
                setAuthError(true);
                router.replace('/web_view/Login');
            }
        });
        return () => {
            cancelled = true;
        };
    }, [router]);

    const { data: boards } = useBoardList();
    const { data: top } = useTopArticles(3);

    // Resolve every section's boardId/topicId once boards load. Each
    // section gets its own cached query — back-navigating to Main shows
    // the previous data instantly, then revalidates in the background.
    const sectionRefs = useMemo(
        () => ({
            talk: lookupBoard(boards, 'talk'),
            portal: lookupBoard(boards, 'portal-notice'),
            facility: lookupBoard(boards, 'facility-notice'),
            ara: lookupBoard(boards, 'ara-notice'),
            realEstate: lookupBoard(boards, 'real-estate'),
            market: lookupBoard(boards, 'market'),
            wanted: lookupBoard(boards, 'wanted'),
            grad: lookupBoard(boards, 'students-group', 'grad-assoc'),
            undergrad: lookupBoard(boards, 'students-group', 'undergrad-assoc'),
            freshman: lookupBoard(boards, 'students-group', 'freshman-council'),
        }),
        [boards],
    );

    const talks = useBoardSection({ ...sectionRefs.talk, pageSize: 3 }).data ?? [];
    const portal = useBoardSection({ ...sectionRefs.portal, pageSize: 3 }).data ?? [];
    const facility = useBoardSection({ ...sectionRefs.facility, pageSize: 3 }).data ?? [];
    const ara = useBoardSection({ ...sectionRefs.ara, pageSize: 3 }).data ?? [];
    const realEstate = useBoardSection({ ...sectionRefs.realEstate, pageSize: 3 }).data ?? [];
    const market = useBoardSection({ ...sectionRefs.market, pageSize: 3 }).data ?? [];
    const wanted = useBoardSection({ ...sectionRefs.wanted, pageSize: 3 }).data ?? [];
    const grad = useBoardSection({ ...sectionRefs.grad, pageSize: 3 }).data ?? [];
    const undergrad = useBoardSection({ ...sectionRefs.undergrad, pageSize: 3 }).data ?? [];
    const freshman = useBoardSection({ ...sectionRefs.freshman, pageSize: 3 }).data ?? [];

    // Wire native pull-to-refresh — invalidates the whole webview cache.
    usePullToRefresh();

    const goBoard = (slug: string) => {
        const board = boards?.find((b) => b.slug === slug);
        if (board) router.push(`/web_view/Board/${board.id}`);
    };
    const goPost = (id: number) => router.push(`/web_view/Post/${id}`);

    const tradeFirst = useMemo(
        () => ({
            realEstate: realEstate[0] ?? null,
            market: market[0] ?? null,
            wanted: wanted[0] ?? null,
        }),
        [realEstate, market, wanted],
    );

    if (authError) return null;

    const topList = top ?? [];

    return (
        <Screen>
            <HomeAppBar />

            {/* 실시간 인기 */}
            <section className="pt-2">
                <MainPageTextButton label="실시간 인기글" onPress={() => router.push('/web_view/Board/_top')} />
                <div className="px-5">
                    {[0, 1, 2].map((i) => {
                        const post = topList[i];
                        if (!post) return null;
                        return (
                            <div key={post.id}>
                                <PopularBoardRow post={post} rank={i + 1} />
                                {i < 2 && topList[i + 1] && (
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
                    {portal[0] && (
                        <>
                            <button type="button" onClick={() => goPost(portal[0].id)} className="block w-full bg-transparent text-left">
                                <LittleText post={portal[0]} />
                            </button>
                            <div className="h-[10px]" />
                        </>
                    )}
                    {portal[1] && (
                        <>
                            <button type="button" onClick={() => goPost(portal[1].id)} className="block w-full bg-transparent text-left">
                                <LittleText post={portal[1]} />
                            </button>
                            <div className="h-[10px]" />
                        </>
                    )}
                    {portal[2] && (
                        <>
                            <button type="button" onClick={() => goPost(portal[2].id)} className="block w-full bg-transparent text-left">
                                <LittleText post={portal[2]} />
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
                        post={facility[0] ?? null}
                        onPostTap={() => facility[0] && goPost(facility[0].id)}
                    />
                    <div className="h-[10px]" />
                    <NoticeRow
                        label="Ara 운영진"
                        color="#ED3A3A"
                        onLabelTap={() => goBoard('ara-notice')}
                        post={ara[0] ?? null}
                        onPostTap={() => ara[0] && goPost(ara[0].id)}
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
                    <StudentRow label="원총" post={grad[0] ?? null} onTap={() => grad[0] && goPost(grad[0].id)} />
                    <div className="h-[10px]" />
                    <StudentRow label="총학" post={undergrad[0] ?? null} onTap={() => undergrad[0] && goPost(undergrad[0].id)} />
                    <div className="h-[10px]" />
                    <StudentRow label="새학" post={freshman[0] ?? null} onTap={() => freshman[0] && goPost(freshman[0].id)} />
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
