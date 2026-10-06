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

interface Major {
    std_dept_id: number;
    major_code: string;
    major_name: string;
    major_name_eng: string | null;
    is_added: boolean;
    is_mine: boolean;
    readers_count: number;
}
