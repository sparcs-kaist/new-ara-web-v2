'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { UserProfileArticleList, BoardRecentArticleList, BoardBookmarkedArticlesList } from '@/containers/ArticleList';
import { fetchUserProfile } from '@/lib/api/user_profile';
import { blockUser, unblockUser } from '@/lib/api/user';
import { createDM, getDmByUserId } from '@/lib/api/chat';
import { useBlockList } from '@/lib/query/user';
import { GeneralUserProfile } from '@/lib/types/user_profile';
import AlertDialog from '@/components/Dialog/AlertDialog';
import Image from 'next/image';

interface BlockedUser {
    user: {
        id: number;
    };
}

interface BlockListResponse {
    results: BlockedUser[];
}

export default function UserProfilePage() {
    const params = useParams<{ user_id: string }>();
    const { data: blockList } = useBlockList() as {
        data: BlockListResponse | undefined;
    };
    const router = useRouter();
    const [userProfile, setUserProfile] = useState<GeneralUserProfile | null>(null);
    const [isBlocked, setIsBlocked] = useState(false); // 현재 프로필을 조회하고 있는 User가 차단된 상태인지 여부
    const [isMyProfile, setIsMyProfile] = useState(false);
    const [DM, setDM] = useState<null | number>(null); // 현재 Profile을 조회하고 있는 사용자와의 DM방이 이미 존재하는지 여부


    // Dialog State Management
    const [menuOpen, setMenuOpen] = useState(false);
    const [isBlockDialogOpen, setIsBlockDialogOpen] = useState(false);
    const [isUnblockDialogOpen, setIsUnblockDialogOpen] = useState(false);
    const [isDMDialogOpen, setIsDMDialogOpen] = useState(false);

    const menuRef = useRef<HTMLDivElement>(null);

    // fetch User Profile
    useEffect(() => {
        if (params.user_id) {
            const userId = parseInt(params.user_id, 10);
            fetchUserProfile(userId).then((data) => {
                setUserProfile(data);
                //본인의 Profile을 조회한 경우 : api response에 email이 포함됨
                setIsMyProfile(!!data.email);
            });
        }
    }, [params.user_id]);

    useEffect(() => {
        if (!blockList?.results) return;
        const ids = blockList.results.map((item) => item.user.id);
        setIsBlocked(ids.includes(Number(params.user_id)));
    }, [blockList]);

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

    useEffect(() => {
        if (params.user_id) {
            const userId = parseInt(params.user_id, 10);
            getDmByUserId(userId).then((data) => {
                setDM(data.dm_room);
            });
        }
    }, [params.user_id]);

    // 실제 차단 API를 호출할 함수
    const handleConfirmBlock = () => {
        blockUser(params.user_id!).then(() => {
            setIsBlocked(true);
        });
        setIsBlockDialogOpen(false);
    };

    const handleConfirmUnblock = () => {
        unblockUser(params.user_id!).then(() => {
            setIsBlocked(false);
        });
        setIsUnblockDialogOpen(false);
    };

    // DM chatroom 생성 함수
    const createDMRoom = async () => {
        if (!userProfile) return;
        try {
            const dmRoom = await createDM(userProfile.user);
            //생성된 채팅방으로 이동
            router.push(`/chat/${dmRoom.id}/`);
        } catch (error) {
            console.error("DM 생성 실패:", error);
            alert("DM 생성에 실패했습니다. 다시 시도해주세요.");
        }
    }

    const handleMenuAction = (action: string) => {
        setMenuOpen(false);
        switch (action) {
            case 'chat':
                if (DM != null) {
                    router.push(`/chat/${DM}/`);
                } else {
                    setIsDMDialogOpen(true);
                }
                break;

            /* 친구 기능 : ToDO?
            case 'friend':
                console.log('친구 추가');
                break;
            */

            case 'block_message':
                console.log('메시지 차단');
                break;
            case 'block_user':
                setIsBlockDialogOpen(true);
                break;
            case 'unblock_user':
                setIsUnblockDialogOpen(true);
                break;
        }
    };

    return (
        <div className="min-h-screen">
            {/* 사용자 차단 / 차단 해제 다이얼로그 */}
            <AlertDialog
                isOpen={isBlockDialogOpen}
                onClose={() => setIsBlockDialogOpen(false)}
                onConfirm={handleConfirmBlock}
                title="사용자 차단"
                description={`정말로 ${userProfile?.nickname || '이 사용자'}을(를) 차단하시겠습니까? 차단 시 해당 사용자의 게시글이 숨김 처리 됩니다.`}
                confirmText="차단하기"
                cancelText="취소"
                isDestructive={true}
            />

            <AlertDialog
                isOpen={isUnblockDialogOpen}
                onClose={() => setIsUnblockDialogOpen(false)}
                onConfirm={handleConfirmUnblock}
                title="사용자 차단 해제"
                description={`정말로 ${userProfile?.nickname || '이 사용자'}을(를) 차단 해제하시겠습니까?`}
                confirmText="차단 해제"
                cancelText="취소"
                isDestructive={true}
            />

            {/* 채팅방 생성 확인 Dialog */}
            <AlertDialog
                isOpen={isDMDialogOpen}
                onClose={() => setIsDMDialogOpen(false)}
                onConfirm={createDMRoom}
                title="1:1 채팅방 생성"
                description={`${userProfile?.nickname || 'unknown'} 사용자와 1:1 채팅방을 만드시겠습니까?`}
                confirmText="채팅방 생성"
                cancelText="취소"
                isDestructive={true}
            />

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

                                    {/* 더보기(Kebab) 메뉴 : 본인 프로필일 때는 숨김*/}
                                    {!isMyProfile && (
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
                                                        className="w-full text-left px-4 py-2 text-sm text-black hover:bg-gray-50 flex items-center gap-2"
                                                    >
                                                        채팅하기
                                                    </button>
                                                    <hr className="my-1 border-gray-100" />
                                                    <button
                                                        onClick={() => handleMenuAction('block_message')}
                                                        className="w-full text-left px-4 py-2 text-sm text-gray- hover:bg-gray-50 flex items-center gap-2"
                                                    >
                                                        메시지 차단
                                                    </button>
                                                    {isBlocked ? (
                                                        <button
                                                            onClick={() => handleMenuAction('unblock_user')}
                                                            className="w-full text-left px-4 py-2 text-sm text-black hover:bg-green-50 flex items-center gap-2"
                                                        >
                                                            차단 해제
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleMenuAction('block_user')}
                                                            className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 flex items-center gap-2"
                                                        >
                                                            사용자 차단
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div>
                                <span className="block text-left text-black font-semibold ">작성한 글</span>
                                <hr className="border-t-2 border-gray-300 mt-2 mb-2" />
                                <UserProfileArticleList userId={parseInt(params.user_id, 10)} />
                            </div>
                        </div>
                    </div>

                    {/* 사이드바 영역 */}
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