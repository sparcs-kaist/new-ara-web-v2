"use client";
import Sidebar from "@/components/Sidebar/Sidebar";
import ExpandSelect from "@/components/ExpandSelect";
import { useState } from "react";
import { MajorSelectModal } from "./MajorSelectModal";
import { CourseBoardGrid, MajorBoardGrid } from "@/containers/Campus";
import { useCourseTerms } from "@/lib/query/campus";

const FILTER_CLASS = "w-32 h-9";
const FILTER_BOX_CLASS =
    "bg-white outline outline-1 outline-offset-[-1px] outline-black/20 rounded-[18px] text-zinc-800 text-sm font-normal font-['Pretendard']";

// semester 1~4 의 표시 이름
const SEASON_LABELS = ["봄", "여름", "가을", "겨울"];

export default function Campus() {
    const { data: terms = [] } = useCourseTerms();
    const [pickedYear, setPickedYear] = useState<number>();
    const [pickedSemester, setPickedSemester] = useState<number>();
    const [isModalOpen, setIsModalOpen] = useState(false);

    const years = [...new Set(terms.map((term) => term.year))];
    const selectedYear = pickedYear !== undefined && years.includes(pickedYear) ? pickedYear : years[0];
    const semesters = terms.filter((term) => term.year === selectedYear).map((term) => term.semester);
    const selectedSemester = pickedSemester !== undefined && semesters.includes(pickedSemester) ? pickedSemester : semesters[0];

    return (

        // <div className="bg-white rounded-lg shadow-sm md:p-6 sm:p-3">
        <div className="min-h-screen">
            <div className="container mx-auto md:px-20 sm:px-12 xs:px-8 px-4 py-0">
                <div className="flex flex-col lg:flex-row gap-4 py-8">
                    <div className="flex flex-col lg:w-2/3 xl:w-3/4 gap-16">
                        <div className="absolute top-0 left-0 w-full h-[300px] -z-10 bg-gradient-to-b from-[#fcefef] to-white" />
                        <section className="flex flex-col gap-6">
                            <div className="flex flex-wrap justify-between items-center gap-2">
                                <h2 className="text-2xl font-bold">📚 수업 게시판</h2>
                                <div className="flex gap-2">
                                    <ExpandSelect
                                        options={years.map((year) => ({ value: String(year), label: `${year}년` }))}
                                        value={selectedYear === undefined ? "" : String(selectedYear)}
                                        onChange={(v) => setPickedYear(Number(v))}
                                        className={FILTER_CLASS}
                                        boxClassName={FILTER_BOX_CLASS}
                                        itemClassName="hover:bg-zinc-50 transition-colors"
                                    />
                                    <ExpandSelect
                                        options={semesters.map((semester) => ({ value: String(semester), label: SEASON_LABELS[semester - 1] }))}
                                        value={selectedSemester === undefined ? "" : String(selectedSemester)}
                                        onChange={(v) => setPickedSemester(Number(v))}
                                        className={FILTER_CLASS}
                                        boxClassName={FILTER_BOX_CLASS}
                                        itemClassName="hover:bg-zinc-50 transition-colors"
                                    />
                                </div>
                            </div>

                            <CourseBoardGrid year={selectedYear} semester={selectedSemester} />
                        </section>

                        <section className="flex flex-col gap-6">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <h2 className="text-2xl font-bold">👨🏻‍🏫 학과 게시판</h2>
                                    <button
                                        className="w-8 h-8 flex justify-center items-center bg-white rounded-2xl outline outline-1 outline-offset-[-1px] outline-gray-200 hover:bg-gray-50 transition-colors"
                                        onClick={() => setIsModalOpen(true)}
                                    >
                                        <svg
                                            width="20"
                                            height="20"
                                            viewBox="0 0 20 20"
                                            fill="none"
                                            xmlns="http://www.w3.org/2000/svg"
                                        >
                                            <g clipPath="url(#clip0_191_5830)">
                                                <path
                                                    d="M18.9399 15.7917L11.3566 8.2084C12.1066 6.29174 11.6899 4.04174 10.1066 2.4584C8.43989 0.791738 5.93989 0.458404 3.93989 1.37507L7.52322 4.9584L5.02322 7.4584L1.35656 3.87507C0.356557 5.87507 0.773224 8.37507 2.43989 10.0417C4.02322 11.6251 6.27322 12.0417 8.18989 11.2917L15.7732 18.8751C16.1066 19.2084 16.6066 19.2084 16.9399 18.8751L18.8566 16.9584C19.2732 16.6251 19.2732 16.0417 18.9399 15.7917Z"
                                                    fill="#808080"
                                                />
                                            </g>
                                            <defs>
                                                <clipPath id="clip0_191_5830">
                                                    <rect width="20" height="20" fill="white" />
                                                </clipPath>
                                            </defs>
                                        </svg>
                                    </button>
                                </div>
                            </div>

                            <MajorBoardGrid />
                        </section>
                    </div>

                    {/* 헤더(36px) + section gap-6(24px) 만큼 내려 카드 시작점에 맞춘다 */}
                    <Sidebar className="lg:pt-[60px]" />
                </div>

                <MajorSelectModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
            </div>
        </div>
    )
}