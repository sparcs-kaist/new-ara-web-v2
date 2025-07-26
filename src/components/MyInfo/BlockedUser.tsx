'use client';
import { useTranslation } from 'react-i18next';
import Image from "next/image";
import React from 'react';

const BlockedUser = () => {
    const { t } = useTranslation();
    const deleteBlockedUser = () => {};
    return (
        <div>
            <ul className="px-2 py-0 text-sm w-full">
            <li>
                <div className="flex flex-row items-center justify-center my-[10px]">
                <Image src="/user.png" width={32} height={32} className="mr-[0.5rem] object-cover rounded-full" alt="Blocked User Image"/>
                <span className="truncate">환호하는 고구마_ab12</span>
                <a onClick={deleteBlockedUser} className="ml-auto flex items-center justify-center cursor-pointer">
                    <i className="material-icons h-[2rem] !leading-[2rem]">close</i>
                </a>
                </div>
            </li>
            <li>
                <div className="flex flex-row items-center justify-center my-[10px]">
                <Image src="/user.png" width={32} height={32} className="mr-[0.5rem] object-cover rounded-full" alt="Blocked User Image"/>
                <span className="truncate">nickname</span>
                <a onClick={deleteBlockedUser} className="ml-auto flex items-center justify-center cursor-pointer">
                    <i className=" material-icons h-[2rem] !leading-[2rem]">close</i>
                </a>
                </div>
            </li>
            </ul>
            <div className="p-[10px] text-sm">{t('차단한 유저가 없습니다.')}</div>
        </div>
    );
};

export default BlockedUser;