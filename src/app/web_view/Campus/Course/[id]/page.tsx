'use client';

import { useParams } from 'next/navigation';
import { useCourse } from '@/app/web_view/_query';
import { ScopedBoardScreen } from '../../_components/ScopedBoardScreen';

export default function CourseBoardPage() {
    const id = Number(useParams<{ id: string }>().id);
    const { course, isPending } = useCourse(id);
    const professors = course?.professors.map((p) => p.name).join(', ') ?? '';
    const lines = course ? [course.course_code, [course.department_name, professors].filter(Boolean).join(' · ')].filter(Boolean) : [];

    return (
        <ScopedBoardScreen
            label="수업 게시판"
            title={course?.title ?? null}
            lines={lines}
            pending={isPending}
            scope={{ courseId: id }}
            canWrite
            forbiddenMessage="수강 중인 과목만 볼 수 있어요"
        />
    );
}
