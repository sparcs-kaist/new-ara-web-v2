'use client';

import { useRouter, useSearchParams, useParams } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import { UserProfileArticleList, BoardRecentArticleList, BoardBookmarkedArticlesList } from '@/containers/ArticleList';
import { fetchUserProfile, fetchUserPosts } from '@/lib/api/user_profile';
import Image from 'next/image';

export default function UserProfilePage() {

    const params = useParams<{ user_id: string }>();

    return (
        <div className="min-h-screen">
            <div className="container mx-auto md:px-20 sm:px-12 xs:px-8 px-4 py-0">
                <div className="flex flex-col lg:flex-row gap-4">
                    <div className="lg:w-2/3 xl:w-3/4">
                        <div className="bg-white rounded-lg shadow-sm md:p-6 sm:p-3">
                            <div className="mb-3">
                                <h3 className="text-xl font-semibold text-black">원래는 여기가 게시판 제목입니다..</h3>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between mt-2 sm:mt-0 flex-wrap">
                                    <div className="flex items-center gap-2 flex-wrap">

                                        <div className="relative">
                                            <input
                                                type="text"
                                                className="rounded-xl pl-8 pr-2 py-1.5 text-sm w-45 bg-gray-50 text-gray-700 font-medium"
                                                placeholder="검색어를 입력하세요"
                                            />
                                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-base pointer-events-none">
                                                <svg width="16" height="16" fill="none" viewBox="0 0 16 16">
                                                    <path d="M11.5 11.5L15 15M7 12A5 5 0 1 1 7 2a5 5 0 0 1 0 10Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                                </svg>
                                            </span>
                                        </div>
                                    </div>

                                    <button
                                        className="border border-ara_red text-ara_red rounded-lg px-3 py-1 text-sm font-normal hover:bg-ara_red hover:text-white transition ml-2 mt-2 sm:mt-0 hidden sm:block"
                                    >
                                        게시물 작성하기
                                    </button>
                                </div>
                                <UserProfileArticleList userId={parseInt(params.user_id, 10)} />
                            </div>
                        </div>
                    </div>

                    <div className="lg:w-1/3 xl:w-1/4">
                        <div className="bg-white rounded-lg shadow-sm px-4 py-8 sticky top-8">
                            <div className="mb-6">
                                <h2 className="text-base font-semibold text-gray-800 mb-2">최근 본 글</h2>
                                <BoardRecentArticleList />
                            </div>
                            <div className="mb-6">
                                <h2 className="text-base font-semibold text-gray-800 mb-2">담아둔 글</h2>
                                <BoardBookmarkedArticlesList />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
