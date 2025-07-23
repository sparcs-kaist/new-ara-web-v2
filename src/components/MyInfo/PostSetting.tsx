'use client';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import React from 'react';

const PostSetting = () => {
    const { t } = useTranslation();
    const [isSexual, setIsSexual] = useState<boolean>(false);
    const [isSocial, setIsSocial] = useState<boolean>(false);
    const toggleSexual = () => {
      setIsSexual((prev) => !prev);
    };
    const toggleSocial = () => {
      setIsSocial((prev) => !prev);
    };

    return (
        <div>
            <div className="p-[10px] w-full">
            <div className="flex justify-between items-center p-[8px] h-[30px]">
                <span className="text-sm">{t('성인글 보기')}</span>
                <div onClick={toggleSexual} className="cursor-pointer flex-shrink-0">
                {isSexual ? (
                    <i className="material-icons text-ara_red !text-[30px]">toggle_on</i>
                ) : (
                    <i className="material-icons text-gray-400 !text-[30px]">toggle_off</i>
                )}
                </div>
            </div>
            <div className="flex justify-between items-center p-[8px] h-[30px]">
                <span className="text-sm">{t('settings-social')}</span>
                <div onClick={toggleSocial} className="cursor-pointer">
                {isSocial ? (
                    <i className="material-icons text-ara_red !text-[30px]">toggle_on</i>
                ) : (
                    <i className="material-icons text-gray-400 !text-[30px]">toggle_off</i>
                )}
                </div>
            </div>
            </div>
        </div>
    );
};

export default PostSetting;