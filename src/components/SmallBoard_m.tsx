'use client';
import { useTranslation } from 'react-i18next';
import { ReactNode } from "react";

interface SmallBoard_mProps {
    title: string;
    children: ReactNode;
};

const SmallBoard_m = ({title, children}: SmallBoard_mProps) => {
    const { t } = useTranslation();
    return (
        <div 
            className="flex-shrink-0 pd-[5px]"
            style={{ marginLeft: 'clamp(20px, 5vw, 150px)', width: '270px'}}
        >
            <div className="text-[18px] font-bold mb-[10px] text-black">{t(title)}</div>
            <div className="bg-gray-50 p-[10px] w-[270px] mb-[32px] rounded-2xl flex flex-col text-black">
                {children}
            </div>
        </div>
    );
};

export default SmallBoard_m;