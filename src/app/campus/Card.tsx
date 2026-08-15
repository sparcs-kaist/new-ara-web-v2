"use client"
import Link from "next/link"

type CourseCardProps = Pick<Course, "id" | "course_code" | "title" | "professors" | "credit" | "enrollment_count">

export const CourseCard = ({ id, course_code, title, professors, credit, enrollment_count }: CourseCardProps) => {
    return (
        <Link href={`/course_board/${id}`} className="flex flex-col gap-2.5 shadow-[0px_4px_4px_0px_rgba(0,0,0,0.10)] w-full bg-white rounded-2xl border border-gray-200 px-[11px] py-[8px] cursor-pointer">
            <div className="flex flex-col gap-3.5">
                <div className="flex flex-col gap-[3px]">
                    <div className="flex flex-col gap-0">
                        <span className="text-[#808080] text-base font-normal">{course_code}</span>
                        <span className="text-black text-2xl font-bold">{title}</span>
                    </div>
                    <hr className="border-neutral-200" />
                </div>

                <div className="flex justify-between items-center pb-1">
                    <div className="flex items-center gap-1.5 text-base font-medium">
                        <span className="text-[#808080]">교수자</span>
                        <span className="text-black">{professors.map(p => p.name).join(", ")}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[#808080] text-base font-medium">
                        <span>{enrollment_count} 명</span>
                        <div className="w-px h-4 bg-zinc-500" />
                        <span>{credit} 학점</span>
                    </div>
                </div>
            </div>
        </Link>
    )
}



export const DeptCard = ({}) => {
    return (
        <Link href={`/major_board/${1}`} className="flex flex-col gap-2.5 shadow-[0px_4px_4px_0px_rgba(0,0,0,0.10)] w-full bg-white rounded-2xl border border-gray-200 px-[11px] py-[8px] cursor-pointer">
            <div className="flex flex-col gap-3.5">
                <div className="flex flex-col gap-[3px]">
                    <div className="flex flex-col gap-0">
                        <span className="text-[#808080] text-base font-normal">{"Industrial Design"}</span>
                        <span className="text-black text-2xl font-bold">{"산업디자인학과"}</span>
                    </div>
                    <hr className="border-neutral-200" />
                </div>

                <div className="flex justify-between items-center pb-1">
                    <div className="flex items-center gap-1.5 text-base font-medium">
                        <span className="text-[#808080]">N25</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[#808080] text-base font-medium">
                        <span>114 명</span>
                    </div>
                </div>
            </div>
        </Link>
    )
}