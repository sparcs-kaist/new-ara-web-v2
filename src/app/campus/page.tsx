"use client";
import Sidebar from "@/components/Sidebar/Sidebar";
import { useEffect, useState } from "react";
import { CourseCard, DeptCard } from "./Card";
import { DeptSelectModal } from "./DeptSelectModal";
import { useQuery } from "@tanstack/react-query";
import { fetchCourses } from "@/lib/api/user";

interface FilterSelectProps {
    options: number[] | string[];
    value: number | string;
    onChange: React.ChangeEventHandler<HTMLSelectElement>;
}

export const FilterSelect = ({ options, value, onChange }: FilterSelectProps) => {
    return (
        <div className="relative inline-flex items-center group">
            <select
                className="
                w-32 px-3.5 py-2 bg-white rounded-[30px] 
                outline outline-1 outline-offset-[-1px] outline-black/20 
                text-zinc-800 text-sm font-normal font-['Pretendard']
                
                appearance-none cursor-pointer 
                hover:bg-zinc-50 transition-colors
                focus:outline-zinc-400
                "
                value={value}
                onChange={onChange}
            >
                {options.map((option) => (
                    <option key={option} value={option}>{option}</option>
                ))}
            </select>

            <div className="absolute right-4 pointer-events-none flex items-center justify-center">
                <svg
                    width="10"
                    height="6"
                    viewBox="0 0 10 6"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
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

const seasons = ["봄", "여름", "가을", "겨울"];

export default function Campus() {
    const [years, setYears] = useState<string[]>([]);
    const [selectedYear, setSelectedYear] = useState<string>("2026년");
    const [selectedSeason, setSelectedSeason] = useState("봄");
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        setYears(["2024년", "2025년", "2026년"]);
    }, []);

    const { data, isLoading } = useQuery({
        queryKey: ["courses"],
        queryFn: () => fetchCourses(),
        staleTime: 0 //1000 * 60 * 60 * 24
    })

    const courses: Course[] = data

    return (
        <div className="max-w-[1280px] mx-auto">
            <div className="absolute top-0 left-0 w-full h-[300px] -z-10 bg-gradient-to-b from-[#fcefef] to-white" />
            <div className="flex gap-8 px-0 py-10">
                <div className="flex-1 min-w-0 flex flex-col gap-12">
                    <section className="flex flex-col gap-6">
                        <div className="flex justify-between items-center">
                            <h2 className="text-2xl font-bold">📚 수업 게시판</h2>
                            <div className="flex gap-2">
                                <FilterSelect
                                    options={years}
                                    value={selectedYear}
                                    onChange={(e) => setSelectedYear(e.target.value)}
                                />
                                <FilterSelect
                                    options={seasons}
                                    value={selectedSeason}
                                    onChange={(e) => setSelectedSeason(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-6">
                            {isLoading || courses.map((course) => (
                                <CourseCard key={course.id} {...course} />
                            ))}
                        </div>
                    </section>

                    <section className="flex flex-col gap-6">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <h2 className="text-2xl font-bold">👨🏻‍🏫 학과 게시판</h2>
                                <button
                                    className="w-8 h-8 flex justify-center items-center bg-white rounded-2xl shadow-[0px_4px_4px_0px_rgba(0,0,0,0.10)] outline outline-1 outline-offset-[-1px] outline-gray-200 hover:bg-gray-50 transition-colors"
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

                        <div className="grid grid-cols-3 gap-6">
                            {new Array(9).fill(null).map((_, idx) => (
                                <DeptCard key={idx} />
                            ))}
                        </div>
                    </section>
                </div>

                <Sidebar />
            </div>

            <DeptSelectModal
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                onSave={() => {
                    alert("저장되었습니다!");
                    setIsModalOpen(false);
                }}
            />
        </div>
    )   
}