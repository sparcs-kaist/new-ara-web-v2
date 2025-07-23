'use client';
import { useTranslation } from 'react-i18next';
import { ReactNode } from "react";
import React from 'react';

interface SmallBoardMyInfoProps {
    title: string;
    children: ReactNode;
};

const SmallBoardMyInfo = ({title, children}: SmallBoardMyInfoProps) => {
    const { t } = useTranslation();
    return (
        <div>
            <div className="text-[18px] font-bold mb-[10px] text-black">{t(title)}</div>
            <div className="bg-gray-50 p-[10px] w-[270px] mb-[32px] rounded-2xl flex flex-col text-black">
                {children}
            </div>
        </div>
    );
};

export default SmallBoardMyInfo;