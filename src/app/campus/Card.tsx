"use client"
import Link from "next/link"

type CourseCardProps = Pick<Course, "id" | "course_code" | "title" | "professors" | "credit" | "enrollment_count">

export const CourseCard = ({ id, course_code, title, professors, credit, enrollment_count }: CourseCardProps) => {
    return (
        <Link href={`/course_board/${id}`} className="flex flex-col gap-2.5 shadow-[0px_2px_2px_0px_rgba(0,0,0,0.10)] w-full bg-white rounded-2xl border border-gray-200 px-[11px] py-[8px] cursor-pointer">
            <div className="flex flex-col gap-3.5">
                <div className="flex flex-col gap-[3px]">
                    <div className="flex flex-col gap-0">
                        <span className="text-[#808080] text-base font-normal truncate">{course_code}</span>
                        <span className="text-black text-2xl font-bold break-keep break-words">{title}</span>
                    </div>
                    <hr className="border-neutral-200" />
                </div>

                <div className="flex justify-between items-center pb-1">
                    <div className="flex items-center gap-1.5 text-base font-medium min-w-0">
                        <span className="text-[#808080] shrink-0">교수자</span>
                        <span className="text-black truncate">{professors.map(p => p.name).join(", ")}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[#808080] text-base font-medium shrink-0">
                        <span>{enrollment_count} 명</span>
                        <div className="w-px h-4 bg-zinc-500" />
                        <span>{credit} 학점</span>
                    </div>
                </div>
            </div>
        </Link>
    )
}



type MajorCardProps = Pick<Major, "std_dept_id" | "major_code" | "major_name" | "major_name_eng" | "readers_count">

export const MajorCard = ({ std_dept_id, major_code, major_name, major_name_eng, readers_count }: MajorCardProps) => {
    return (
        <Link href={`/major_board/${std_dept_id}`} className="flex flex-col gap-2.5 shadow-[0px_2px_2px_0px_rgba(0,0,0,0.10)] w-full bg-white rounded-2xl border border-gray-200 px-[11px] py-[8px] cursor-pointer">
            <div className="flex flex-col gap-3.5">
                <div className="flex flex-col gap-[3px]">
                    <div className="flex flex-col gap-0">
                        <span className="text-[#808080] text-base font-normal truncate">{major_name_eng ?? ""}</span>
                        <span className="text-black text-2xl font-bold break-keep break-words">{major_name}</span>
                    </div>
                    <hr className="border-neutral-200" />
                </div>

                <div className="flex justify-between items-center pb-1">
                    <div className="flex items-center gap-1.5 text-base font-medium">
                        <span className="text-[#808080]">{major_code}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[#808080] text-base font-medium">
                        <span>{readers_count} 명</span>
                    </div>
                </div>
            </div>
        </Link>
    )
}