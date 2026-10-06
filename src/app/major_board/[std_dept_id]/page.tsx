'use client';

import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { MajorArticleList } from '@/containers/ArticleList';
import Sidebar from '@/components/Sidebar/Sidebar';
import Link from 'next/link';
import Search from '@/components/Search';
import WriteButton from '@/components/Board/WriteButton';
import { useMyMajors } from '@/lib/query/campus';


export default function MajorBoard() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const stdDeptId = useParams().std_dept_id as string;
    const [search, setSearch] = useState<string>('');
    const [searchInput, setSearchInput] = useState<string>('');

    const major = useMyMajors().data?.find(m => m.std_dept_id === Number(stdDeptId));

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
                                        <h3 className="text-3xl font-extrabold text-black mb-[10px]">{major?.major_name ?? ''}</h3>
                                        <div className="text-lg font-normal text-gray-500 leading-snug">
                                            {major?.major_name_eng && <div>{major.major_name_eng}</div>}
                                            {major && <div>{major.readers_count} 명</div>}
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
                                    {major?.is_mine && (
                                        <WriteButton href={`/write/major?std_dept_id=${stdDeptId}`} />
                                    )}
                                </div>

                                <div className="max-w-none">
                                    <MajorArticleList stdDeptId={stdDeptId} pageSize={10} query={search} />
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
