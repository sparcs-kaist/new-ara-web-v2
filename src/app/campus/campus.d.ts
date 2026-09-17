interface Professor {
    id: number;
    name: string;
}

interface Course {
    id: number;
    course_code: string;
    title: string;
    department_name: string;
    year: number;
    semester: number;
    credit: string;
    professors: Professor[];
    enrollment_count: number;
    last_synced_at: string;
}