'use client';
import { useTranslation } from 'react-i18next';
import Image from "next/image";
import React, { useEffect, useState } from 'react';
import { fetchBlocks, deleteBlock } from '@/lib/api/user';

const BlockedUser = () => {
  const { t } = useTranslation();
  const [blockedUsers, setBlockedUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const data = await fetchBlocks();
        console.log('blockedUsers:', data.results);
        setBlockedUsers(data.results || []);
        setError(null);
      } catch {
        setError(t('차단한 유저 목록을 불러오는 데 실패했습니다.'));
      } finally {
        setLoading(false);
      }
    })();
  }, [t]);
  
  const deleteBlockedUser = async (blockId: number | string) => {
    try {
      await deleteBlock(blockId);
      setBlockedUsers((prev) => prev.filter((block) => block.id !== blockId));
      setError(null);
    } catch {
      setError(t('차단 해제에 실패했습니다.'));
    }
  };

  if (loading) return <div>{t('로딩 중...')}</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  if (blockedUsers.length === 0) {
    return <div className="p-[10px] text-sm">{t('차단한 유저가 없습니다.')}</div>;
  }

  return (
    <div>
      <ul className="px-2 py-0 text-sm w-full">
      {blockedUsers.map((block) => (
        <li key={block.id}>
          <div className="flex flex-row items-center justify-center my-[10px]">
            <Image
              src={block.user.profile?.picture || "/user.png"} // 프로필 사진이 있을 경우
              width={32}
              height={32}
              className="mr-[0.5rem] object-cover rounded-full"
              alt={block.user.username || "Blocked User Image"}
            />
            <span className="truncate">{block.user.username || "Unknown"}</span>
            <a
              onClick={() => deleteBlockedUser(block.id)} 
              className="ml-auto flex items-center justify-center cursor-pointer"
            >
              <i className="material-icons h-[2rem] !leading-[2rem]">close</i>
            </a>
          </div>
        </li>
      ))}
      </ul>
    </div>
  );
};

export default BlockedUser;
