import { CourseCard, MajorCard } from "@/app/campus/Card";
import { useCourses, useMyMajors } from "@/lib/query/campus";

const gridClassName = "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6";

interface CourseBoardGridProps {
  year?: number;
  semester?: "봄" | "여름" | "가을" | "겨울";
}

export function CourseBoardGrid({ year, semester }: CourseBoardGridProps) {
  const { data, isPending } = useCourses(year, semester);
  const courses: Course[] = data ?? [];

  if (isPending || !courses.length)
    return <p className="text-[#808080] text-base">{isPending ? "불러오는 중..." : "수업이 없습니다."}</p>;

  return (
    <div className={gridClassName}>
      {courses.map((course) => (
        <CourseCard key={course.id} {...course} />
      ))}
    </div>
  );
}

export function MajorBoardGrid() {
  const { data, isLoading } = useMyMajors();
  const majors: Major[] = data ?? [];

  if (isLoading || !majors.length)
    return <p className="text-[#808080] text-base">{isLoading ? "불러오는 중..." : "학과 게시판이 없습니다."}</p>;

  return (
    <div className={gridClassName}>
      {majors.map((major) => (
        <MajorCard key={major.std_dept_id} {...major} />
      ))}
    </div>
  );
}
