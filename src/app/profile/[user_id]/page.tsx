'use client';

import { useParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { UserProfileArticleList, BoardRecentArticleList, BoardBookmarkedArticlesList } from '@/containers/ArticleList';
import { fetchUserProfile } from '@/lib/api/user_profile';
import { GeneralUserProfile } from '@/lib/types/user_profile';
import Image from 'next/image';

export default function UserProfilePage() {

    const params = useParams<{ user_id: string }>();
    const [userProfile, setUserProfile] = useState<GeneralUserProfile | null>(null);
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    //fetch User Profile
    useEffect(() => {
        if (params.user_id) {
            const userId = parseInt(params.user_id, 10);
            fetchUserProfile(userId).then((data) => {
                setUserProfile(data);
            });
        }
    }, [params.user_id]);

    // 외부 클릭 시 메뉴 닫기
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setMenuOpen(false);
            }
        };
        if (menuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [menuOpen]);

    const handleMenuAction = (action: string) => {
        setMenuOpen(false);
        // TODO: 각 액션에 맞는 API 호출 또는 라우팅
        switch (action) {
            case 'chat':
                console.log('채팅하기');
                break;
            case 'friend':
                console.log('친구 추가');
                break;
            case 'block_message':
                console.log('메시지 차단');
                break;
            case 'block_user':
                console.log('사용자 차단');
                break;
        }
    };

    return (
        <div className="min-h-screen">
            <div className="container mx-auto md:px-20 sm:px-12 xs:px-8 px-4 py-0">
                <div className="flex flex-col lg:flex-row gap-4">
                    <div className="lg:w-2/3 xl:w-3/4">
                        <div className="bg-white rounded-lg shadow-sm md:p-6 sm:p-3">
                            <div className="mb-3">
                                <div className="flex items-center mb-6">
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

                                    {/* 더보기(Kebab) 메뉴 */}
                                    <div className="relative ml-2" ref={menuRef}>
                                        <button
                                            onClick={() => setMenuOpen((prev) => !prev)}
                                            className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
                                            aria-label="더보기"
                                        >
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-gray-500">
                                                <circle cx="12" cy="5" r="2" />
                                                <circle cx="12" cy="12" r="2" />
                                                <circle cx="12" cy="19" r="2" />
                                            </svg>
                                        </button>

                                        {menuOpen && (
                                            <div className="absolute left-0 top-full font-semibold mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1">
                                                <button
                                                    onClick={() => handleMenuAction('chat')}
                                                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                                >
                                                    💬 채팅하기
                                                </button>
                                                {/* 친구 기능 : @ Todo 
                                                <button
                                                    onClick={() => handleMenuAction('friend')}
                                                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                                >
                                                    👤 친구 추가
                                                </button>
                                                */}
                                                <hr className="my-1 border-gray-100" />
                                                <button
                                                    onClick={() => handleMenuAction('block_message')}
                                                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                                >
                                                    🚫 메시지 차단
                                                </button>
                                                <button
                                                    onClick={() => handleMenuAction('block_user')}
                                                    className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 flex items-center gap-2"
                                                >
                                                    ⛔ 사용자 차단
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div>
                                <div className="flex items-center justify-between mt-2 sm:mt-0 flex-wrap">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        {/* User 통계나 게시글 수?*/}
                                    </div>
                                </div>
                                <span className="block text-left text-black font-semibold ">작성한 글</span>
                                <hr className="border-t-2 border-gray-300 mt-2 mb-2" />
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
