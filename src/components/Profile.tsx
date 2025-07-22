'use client';
import Image from "next/image";
import { useTranslation } from 'react-i18next';
import { useState } from 'react';

const Profile = () => {
    const { t } = useTranslation();
    const handlePictureChange = () => {};
    const [isNicknameEditable, setIsNicknameEditable] = useState(false);
    const [newNickname, setNewNickname] = useState('');
    const toggleNicknameInput = (isEditing: boolean) => {
        if (isEditing){

        } else {
            setIsNicknameEditable(false);
        }
    }

    return (
        <div className="flex flex-col items-center mb-[48px]">
            <div className="relative mb-[24px]">
                <Image src="/user.png" width={128} height={128} style={{objectFit: "cover", borderRadius: "100px"}} alt="Profile Image"/>
                <input type="file" className="hidden" style={{ display: "none" }} onChange={handlePictureChange}/>
                <a className="absolute bottom-0 right-0  flex items-center justify-center w-[2rem] h-[2rem] rounded-full bg-white">
                    <i className="material-icons !text-[1.3rem] !leading-[1.3rem]">camera_alt</i>
                </a>
            </div>
            <div className="flex flex-col items-center justify-between">
                {!isNicknameEditable ? (
                    <div className="flex flex-row items-center">
                        <div className="text-[20px] font-extrabold truncate inline-block">
                            hyooyh
                        </div>
                        <a className="ml-1 flex items-center" onClick={() => setIsNicknameEditable(true)}>
                            <i className="material-icons !text-[1.3rem] !leading-[1.3rem]">create</i>
                        </a>
                    </div>
                ) : (
                    <div className="flex items-center space-x-1">
                        <input
                            value={newNickname}
                            onChange={(e) => setNewNickname(e.target.value)}
                            className="w-[150px] h-[30px] text-[16px] font-normal border border-gray-300 rounded-full p-3 shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
                        />
                        <div className="flex space-x-1">
                            <button
                                className="border border-red-400 text-red-500 text-xs font-semibold rounded-full bg-white shadow-sm hover:bg-red-50 transition duration-200"
                                onClick={() => toggleNicknameInput(true)}
                                >
                                {t('확인')}
                            </button>
                            <button
                                className="border border-gray-300 text-gray-600 text-xs font-semibold rounded-full bg-white shadow-sm hover:bg-gray-100 transition duration-200"
                                onClick={() => toggleNicknameInput(false)}
                            >
                                {t('취소')}
                            </button>
                        </div>
                    </div>
                )}
                <div className="text-[16px] text-gray-500 font-medium truncate">ninesens@kaist.ac.kr</div>
            </div>
        </div>
    );
};

export default Profile;
