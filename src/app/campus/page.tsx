"use client";
import Sidebar from "@/components/Sidebar/Sidebar";
import { useEffect, useRef, useState } from "react";
import { MajorSelectModal } from "./MajorSelectModal";
import { CourseBoardGrid, MajorBoardGrid } from "@/containers/Campus";
import { useCourseTerms } from "@/lib/query/campus";

const expandMotion = "duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]";

interface FilterSelectProps {
    options: number[] | string[];
    value: number | string;
    onChange: (value: string) => void;
}

const FilterSelect = ({ options, value, onChange }: FilterSelectProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="relative w-32 h-9" ref={containerRef}>
            <div
                className={`
                absolute top-0 left-0 w-full z-50 overflow-hidden bg-white
                outline outline-1 outline-offset-[-1px] outline-black/20
                transition-[border-radius] ${expandMotion}
                ${isOpen ? "rounded-[20px]" : "rounded-[30px]"}
                `}
            >
                <button
                    type="button"
                    className="
                    w-full px-3.5 py-2
                    text-zinc-800 text-sm font-normal font-['Pretendard']
                    text-left cursor-pointer
                    hover:bg-zinc-50 transition-colors
                    "
                    onClick={() => setIsOpen((prev) => !prev)}
                >
                    {value}
                </button>

                <div
                    className={`grid transition-[grid-template-rows] ${expandMotion} ${isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
                >
                    <div className={`overflow-hidden transition-[opacity,transform] ${expandMotion} ${isOpen ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"}`}>
                        {options
                            .filter((option) => String(option) !== String(value))
                            .map((option) => (
                                <button
                                    key={option}
                                    type="button"
                                    className="block w-full px-3.5 py-2 border-t border-gray-200 text-zinc-800 text-sm font-normal font-['Pretendard'] text-left hover:bg-zinc-50 transition-colors"
                                    onClick={() => {
                                        onChange(String(option));
                                        setIsOpen(false);
                                    }}
                                >
                                    {option}
                                </button>
                            ))}
                    </div>
                </div>
            </div>

            <div className="absolute right-4 top-[18px] -translate-y-1/2 z-[51] pointer-events-none">
                <svg
                    width="10"
                    height="6"
                    viewBox="0 0 10 6"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className={`transition-transform ${expandMotion} ${isOpen ? "rotate-180" : ""}`}
                >
                    <path
                        d="M4.76856 6.00426L3.80093e-05 0.00853585L9.52631 -8.01353e-06L4.76856 6.00426Z"
                        fill="#141414"
                    />
                </svg>
            </div>
        </div>
    );
}

const SEASONS = ["봄", "여름", "가을", "겨울"] as const;

export default function Campus() {
    const { data: terms = [] } = useCourseTerms();
    const [pickedYear, setPickedYear] = useState<number>();
    const [pickedSeason, setPickedSeason] = useState<typeof SEASONS[number]>();
    const [isModalOpen, setIsModalOpen] = useState(false);

    const years = [...new Set(terms.map((term) => term.year))];
    const selectedYear = pickedYear !== undefined && years.includes(pickedYear) ? pickedYear : years[0];
    const seasons = terms.filter((term) => term.year === selectedYear).map((term) => SEASONS[term.semester - 1]);
    const selectedSeason = pickedSeason && seasons.includes(pickedSeason) ? pickedSeason : seasons[0];

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
                                    <FilterSelect
                                        options={years.map((year) => `${year}년`)}
                                        value={selectedYear === undefined ? "" : `${selectedYear}년`}
                                        onChange={(v) => setPickedYear(Number(v.replace("년", "")))}
                                    />
                                    <FilterSelect
                                        options={seasons}
                                        value={selectedSeason ?? ""}
                                        onChange={(v) => setPickedSeason(v as typeof SEASONS[number])}
                                    />
                                </div>
                            </div>

                            <CourseBoardGrid year={selectedYear} semester={selectedSeason} />
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