'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { UserProfileArticleList, BoardRecentArticleList, BoardBookmarkedArticlesList } from '@/containers/ArticleList';
import { fetchUserProfile } from '@/lib/api/user_profile';
import { GeneralUserProfile } from '@/lib/types/user_profile';
import Image from 'next/image';

export default function UserProfilePage() {

    const params = useParams<{ user_id: string }>();
    const [userProfile, setUserProfile] = useState<GeneralUserProfile | null>(null);

    //fetch User Profile
    useEffect(() => {
        if (params.user_id) {
            const userId = parseInt(params.user_id, 10);
            fetchUserProfile(userId).then((data) => {
                setUserProfile(data);
            });
        }
    }, [params.user_id]);

    return (
        <div className="min-h-screen">
            <div className="container mx-auto md:px-20 sm:px-12 xs:px-8 px-4 py-0">
                <div className="flex flex-col lg:flex-row gap-4">
                    <div className="lg:w-2/3 xl:w-3/4">
                        <div className="bg-white rounded-lg shadow-sm md:p-6 sm:p-3">
                            <div className="mb-3">
                                <div className="flex items-center mb-4">
                                    <div className="w-16 h-16 rounded-full overflow-hidden mr-4">
                                        <Image
                                            src={userProfile?.picture || '/default_profile_image.png'}
                                            alt="User Profile"
                                            width={64}
                                            height={64}
                                            className="object-cover"
                                        />
                                    </div>
                                    <h3 className="text-xl font-semibold text-black">{userProfile?.nickname || '알 수 없는 사용자'}</h3>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between mt-2 sm:mt-0 flex-wrap">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        {/* User 통계나 게시글 수?*/}
                                    </div>
                                </div>
                                <span className="block text-left text-black font-bold ">작성한 글</span>
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
