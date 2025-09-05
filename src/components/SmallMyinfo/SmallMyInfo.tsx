/* eslint-disable */

'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { fetchMe } from '@/lib/api/user';

interface UserData {
    picture: string;
    nickname: string;
    num_articles: number;
    num_comments: number;
    num_positive_votes: number;
    email?: string;
    created_at?: string;
    sso_user_info?: { email?: string };
}

const SmallMyInfo = () => {
    const [userData, setUserData] = useState<UserData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const getUserData = async () => {
            try {
                const data = await fetchMe();
                setUserData(data);
            } catch (error) {
                // 로그인하지 않은 사용자는 401 에러를 받으므로, 콘솔에 에러를 찍지 않음
                if ((error as any).response?.status !== 401) {
                    console.error('Failed to fetch user data:', error);
                }
            } finally {
                setLoading(false);
            }
        };
        getUserData();
    }, []);

    // 로딩 중이거나 유저 데이터가 없는 경우 (비로그인 상태 포함)
    if (loading || !userData) {
        return (
            <div className="p-4 bg-white rounded-lg shadow border border-gray-200 h-[122px] flex items-center justify-center">
                <Link href="/login" className="px-6 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition">
                    로그인
                </Link>
            </div>
        );
    }

    const emailToShow = userData.email || userData.sso_user_info?.email || '';
    const formatLocalYYYYMMDD = (d: Date) => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
    };
    const joinedDateText = userData.created_at ? formatLocalYYYYMMDD(new Date(userData.created_at)) : '';

    return (
        <div className="p-4 bg-white rounded-[16px] shadow border border-gray-200 main-page-block-shadow">
            <div className="flex items-center gap-3 mb-3">
                <Image
                    src={userData.picture || '/user.png'}
                    alt="profile picture"
                    width={48}
                    height={48}
                    className="rounded-full object-cover"
                />
                <div>
                    <p className="font-bold text-lg">{userData.nickname}</p>
                    {/* 활동 내역을 flex 컨테이너로 변경 */}
                    <div className="flex gap-4 text-sm">
                        <div className="flex items-center gap-1">
                            <span className="text-gray-500">게시글</span>
                            <span className="font-medium text-gray-800">{userData.num_articles}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <span className="text-gray-500">댓글</span>
                            <span className="font-medium text-gray-800">{userData.num_comments}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <span className="text-gray-500">공감</span>
                            <span className="font-medium text-gray-800">{userData.num_positive_votes}</span>
                        </div>
                    </div>
                </div>
            </div>
            <div className="border-t border-gray-200 pt-3">
                <div className="flex justify-around items-center text-center">
                    <Link href="https://mail.kaist.ac.kr" target="_blank" className="text-black font-medium hover:underline">메일</Link>
                    <div className="h-4 w-px bg-gray-300" />
                    <Link href="https://klms.kaist.ac.kr" target="_blank" className="text-black font-medium hover:underline">KLMS</Link>
                    <div className="h-4 w-px bg-gray-300" />
                    <Link href="https://portal.kaist.ac.kr" target="_blank" className="text-black font-medium hover:underline">포탈</Link>
                    <div className="h-4 w-px bg-gray-300" />
                    <Link href="https://erp.kaist.ac.kr" target="_blank" className="text-black font-medium hover:underline">ERP</Link>
                </div>
            </div>
        </div>
    );
};

export default SmallMyInfo;
