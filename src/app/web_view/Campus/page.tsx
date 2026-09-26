'use client';

import { useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDownIcon, MemberIcon, Screen } from '@/app/web_view/_components';
import { seasonLabel, useCampusTerm, useCourses, useMyMajors } from '@/app/web_view/_query';
import { tick } from '@/app/web_view/hooks/haptic';
import { usePullToRefresh } from '@/app/web_view/hooks/usePullToRefresh';
import { EmptyState } from '@/app/web_view/Meal/Stores/_components/EmptyState';
import { useEntrance } from '@/app/web_view/Meal/Stores/_components/entrance';
import { apiDetail } from '@/lib/api/delivery';
import { BoardCard, BoardCardSkeleton } from './_components/BoardCard';
import { MajorSelectModal } from './_components/MajorSelectModal';
import { TermSelectModal } from './_components/TermSelectModal';

type Modal = 'term' | 'major' | null;

function Pill({ onClick, children }: { onClick: () => void; children: ReactNode }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="flex h-[30px] shrink-0 items-center gap-1 rounded-full border border-[#DDDDDD] bg-white px-3 text-[13px] font-medium text-[#222222]"
        >
            {children}
        </button>
    );
}

function SectionHeader({ title, children }: { title: string; children?: ReactNode }) {
    return (
        <div className="flex h-[52px] items-center gap-2 px-5">
            <h2 className="min-w-0 flex-1 truncate text-[20px] font-semibold text-black">{title}</h2>
            {children}
        </div>
    );
}

function CardGrid({ children }: { children: ReactNode }) {
    return <ul className="grid grid-cols-2 gap-[10px] px-5">{children}</ul>;
}

function Skeletons({ count }: { count: number }) {
    return (
        <CardGrid>
            {Array.from({ length: count }, (_, i) => (
                <li key={i}>
                    <BoardCardSkeleton />
                </li>
            ))}
        </CardGrid>
    );
}

export default function CampusPage() {
    const router = useRouter();
    const { terms, term, selectTerm, isPending: termsPending, isError: termsError, error: termsFailure } = useCampusTerm();
    const courses = useCourses(term?.year, term?.semester);
    const majors = useMyMajors();
    const [modal, setModal] = useState<Modal>(null);
    const enterCourse = useEntrance(!!courses.data);
    const enterMajor = useEntrance(!!majors.data);

    usePullToRefresh();

    const open = (next: Modal) => {
        tick();
        setModal(next);
    };

    return (
        <Screen>
            <header className="sticky top-[var(--ara-safe-top)] z-40 flex h-14 items-center bg-white px-5">
                <h1 className="flex-1 text-[28px] font-bold text-ara_red">내 게시판</h1>
                <button
                    type="button"
                    aria-label="내정보"
                    onClick={() => router.push('/web_view/MyInfo')}
                    className="-mr-2 flex h-11 w-11 items-center justify-center rounded-full text-ara_red"
                >
                    <MemberIcon size={28} />
                </button>
            </header>

            <section>
                <SectionHeader title="수업 게시판">
                    {term && (
                        <>
                            <Pill onClick={() => open('term')}>
                                {term.year}년도
                                <ChevronDownIcon size={14} />
                            </Pill>
                            <Pill onClick={() => open('term')}>
                                {seasonLabel(term.semester)}
                                <ChevronDownIcon size={14} />
                            </Pill>
                        </>
                    )}
                </SectionHeader>
                {termsPending || (term && courses.isPending) ? (
                    <Skeletons count={4} />
                ) : termsError || courses.isError ? (
                    <p className="px-5 py-8 text-center text-[14px] text-[#BBBBBB]">{apiDetail(termsError ? termsFailure : courses.error)}</p>
                ) : !courses.data?.length ? (
                    <div className="px-5 py-8">
                        <EmptyState title="이번 학기 수업이 없어요" description="수강 정보가 아직 없거나 반영 전이에요" />
                    </div>
                ) : (
                    <CardGrid>
                        {courses.data.map((c, i) => (
                            <li key={c.id} {...enterCourse(c.id, i)}>
                                <BoardCard
                                    caption={c.course_code}
                                    title={c.title}
                                    footerLeft="교수자"
                                    footerRight={c.professors.map((p) => p.name).join(', ')}
                                    onPress={() => router.push(`/web_view/Campus/Course/${c.id}`)}
                                />
                            </li>
                        ))}
                    </CardGrid>
                )}
            </section>

            <section className="mt-[30px]">
                <SectionHeader title="학과 게시판">
                    <Pill onClick={() => open('major')}>설정</Pill>
                </SectionHeader>
                {majors.isPending ? (
                    <Skeletons count={2} />
                ) : majors.isError ? (
                    <p className="px-5 py-8 text-center text-[14px] text-[#BBBBBB]">{apiDetail(majors.error)}</p>
                ) : majors.data.length === 0 ? (
                    <div className="flex flex-col items-center px-5 py-8">
                        <EmptyState title="학과를 설정해 주세요" />
                        <button
                            type="button"
                            onClick={() => open('major')}
                            className="mt-4 h-10 rounded-[10px] bg-[#F6F6F6] px-5 text-[14px] font-medium text-[#222222]"
                        >
                            학과 설정
                        </button>
                    </div>
                ) : (
                    <CardGrid>
                        {majors.data.map((m, i) => (
                            <li key={m.std_dept_id} {...enterMajor(m.std_dept_id, i)}>
                                <BoardCard
                                    caption={m.major_name_eng}
                                    title={m.major_name}
                                    footerLeft={m.major_code}
                                    footerRight={`${m.readers_count}명`}
                                    onPress={() => router.push(`/web_view/Campus/Major/${m.std_dept_id}`)}
                                />
                            </li>
                        ))}
                    </CardGrid>
                )}
            </section>

            {modal === 'term' && terms && <TermSelectModal terms={terms} term={term} onSave={selectTerm} onClose={() => setModal(null)} />}
            {modal === 'major' && <MajorSelectModal onClose={() => setModal(null)} />}
        </Screen>
    );
}
