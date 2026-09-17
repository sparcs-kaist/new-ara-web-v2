'use client';

import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { CourseArticleList } from '@/containers/ArticleList';
import Sidebar from '@/components/Sidebar/Sidebar';
import Link from 'next/link';
import Search from '@/components/Search';
import WriteButton from '@/components/Board/WriteButton';
import { useQuery } from '@tanstack/react-query';
import { fetchCourses } from '@/lib/api/user';


export default function CourseBoard() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const courseId = parseInt(useParams().course_id as string);
    const [search, setSearch] = useState<string>('');
    const [searchInput, setSearchInput] = useState<string>('');

    const courses: Course[] = useQuery({
        queryKey: ["courses"],
        queryFn: () => fetchCourses(),
        staleTime: 1000 * 60 * 60 * 24
    }).data ?? []
    
    const handleSearch = () => {
        const trimmed = searchInput.trim();

        const params = new URLSearchParams(Array.from(searchParams.entries()));
        params.delete('page');
        if (trimmed) {
            params.set('search', trimmed);
        } else {
            params.delete('search');
        }
        router.replace(`?${params.toString()}`);
    };

    useEffect(() => {
        const urlSearch = searchParams.get('search') || '';
        setSearch(urlSearch);
        setSearchInput(urlSearch);
    }, [searchParams]);

    return (
        <div className="min-h-screen">
            <div className="container mx-auto md:px-20 sm:px-12 xs:px-8 px-4 py-0">
                <div className="flex flex-col lg:flex-row gap-4">
                    <div className="lg:w-2/3 xl:w-3/4">
                        <div className="bg-white rounded-lg shadow-sm md:p-6 sm:p-3">
                            <div>
                                <div className="flex items-start gap-1 mb-5">
                                    <Link href="/campus" className="w-9 h-9 flex items-center justify-center" aria-label="뒤로가기">
                                        <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M23.5575 11.115L21.4425 9L12.4425 18L21.4425 27L23.5575 24.885L16.6875 18L23.5575 11.115Z" fill="black" />
                                        </svg>
                                    </Link>
                                    <div>
                                        <h3 className="text-3xl font-extrabold text-black mb-[10px]">분자생물학 ID.20017(A)</h3>
                                        <div className="text-lg font-normal text-gray-500 leading-snug">
                                            <div className="flex gap-2">
                                                <span>학과</span>
                                                <span>산업디자인학과</span>
                                            </div>

                                            <div className="flex gap-2">
                                                <span>교수</span>
                                                <span>배석형</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between mt-2 sm:mt-0 flex-wrap">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <Search
                                            searchInput={searchInput}
                                            setSearchInput={setSearchInput}
                                            handleSearch={handleSearch}
                                        />
                                    </div>
                                    {courses.some(c => c.id === courseId) && (
                                        <WriteButton href={`/write/course?course_id=${courseId}`} />
                                    )}
                                </div>

                                <div className="max-w-none">
                                    <CourseArticleList courseId={courseId} pageSize={10} query={search} />
                                </div>
                            </div>
                        </div>
                    </div>

                    <Sidebar />
                </div>
            </div>
        </div>
    );
}
