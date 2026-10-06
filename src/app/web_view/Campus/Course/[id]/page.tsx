'use client';

import { useParams } from 'next/navigation';
import { useCourse } from '@/app/web_view/_query';
import { ScopedBoardScreen } from '../../_components/ScopedBoardScreen';

export default function CourseBoardPage() {
    const id = Number(useParams<{ id: string }>().id);
    const { course, isPending } = useCourse(id);
    const professors = course?.professors.map((p) => p.name).join(', ') ?? '';
    const lines = course ? [course.department_name && `학과  ${course.department_name}`, professors && `교수  ${professors}`].filter(Boolean) : [];

    return (
        <ScopedBoardScreen
            label="수업게시판"
            title={course ? `${course.title} ${course.course_code}` : null}
            lines={lines}
            pending={isPending}
            scope={{ courseId: id }}
            canWrite
            forbiddenMessage="수강 중인 과목만 볼 수 있어요"
        />
    );
}
