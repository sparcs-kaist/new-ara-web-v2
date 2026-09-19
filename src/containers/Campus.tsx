import { CourseCard, MajorCard } from "@/app/campus/Card";
import BoardGrid from "@/components/Campus/BoardGrid";
import { useCourses, useMyMajors } from "@/lib/query/campus";

interface CourseBoardGridProps {
  year?: number;
  semester?: number;
}

export function CourseBoardGrid({ year, semester }: CourseBoardGridProps) {
  const { data, isPending } = useCourses(year, semester);
  const courses: Course[] = data ?? [];

  return (
    <BoardGrid isPending={isPending} isEmpty={!courses.length} emptyText="수업이 없습니다.">
      {courses.map((course) => (
        <CourseCard key={course.id} {...course} />
      ))}
    </BoardGrid>
  );
}

export function MajorBoardGrid() {
  const { data, isPending } = useMyMajors();
  const majors: Major[] = data ?? [];

  return (
    <BoardGrid isPending={isPending} isEmpty={!majors.length} emptyText="학과 게시판이 없습니다.">
      {majors.map((major) => (
        <MajorCard key={major.std_dept_id} {...major} />
      ))}
    </BoardGrid>
  );
}
