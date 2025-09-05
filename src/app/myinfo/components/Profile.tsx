'use client';
import Image from 'next/image';
import { useTranslation } from 'react-i18next';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { fetchMe, updateUser } from '@/lib/api/user';

const MAX_SIZE_MB = 3; // 최대 업로드 용량 제한
const NICKNAME_CHANGE_INTERVAL_MONTHS = 3; // 닉네임 변경 주기

const createImage = (url: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = url;
  });

const getCroppedImg = async (
  imageSrc: string,
  crop: { x: number; y: number; width: number; height: number },
  rotation = 0,
  scale = 1
): Promise<Blob> => {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  canvas.width = crop.width;
  canvas.height = crop.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get canvas context');

  ctx.drawImage(
    image,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    crop.width,
    crop.height
  );

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Blob 생성 실패'));
      },
      'image/jpeg',
      0.9
    );
  });
};

const Profile = () => {
  const { t } = useTranslation();

  const [userId, setUserId] = useState<number | null>(null);
  const [profileImage, setProfileImage] = useState<string>('/user.png');
  const [nickname, setNickname] = useState('');
  const [newNickname, setNewNickname] = useState('');
  const [nicknameLastChanged, setNicknameLastChanged] = useState<Date | null>(null);
  const [isNicknameEditable, setIsNicknameEditable] = useState(false);
  const [email, setEmail] = useState('');
  const [seeSexual, setSeeSexual] = useState(false);
  const [seeSocial, setSeeSocial] = useState(false);
  const [selectedPicture, setSelectedPicture] = useState<File | null>(null);

  const [croppingImage, setCroppingImage] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const data = await fetchMe();
        setUserId(data.user);
        setProfileImage(data.picture || '/user.png');
        setEmail(data.email || '');
        setNickname(data.nickname || '');
        setNewNickname(data.nickname || '');
        setSeeSexual(data.see_sexual);
        setSeeSocial(data.see_social);
        setNicknameLastChanged(
          data.nickname_last_changed ? new Date(data.nickname_last_changed) : null
        );
      } catch (error) {
        console.error('프로필 정보 로딩 실패', error);
      }
    };
    loadProfile();
  }, []);

  const nextNicknameChangeDate = nicknameLastChanged
    ? new Date(
        nicknameLastChanged.getFullYear(),
        nicknameLastChanged.getMonth() + NICKNAME_CHANGE_INTERVAL_MONTHS,
        nicknameLastChanged.getDate()
      )
    : null;

  const canChangeNickname = !nextNicknameChangeDate || new Date() >= nextNicknameChangeDate;

  const handlePictureClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handlePictureChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!e.target.files || e.target.files.length === 0) return;

      const file = e.target.files[0];
      const sizeMB = file.size / (1024 * 1024);

      if (sizeMB > MAX_SIZE_MB) {
        alert(`이미지 용량은 ${MAX_SIZE_MB}MB 이하만 가능합니다.`);
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result) setCroppingImage(reader.result.toString());
      };
      reader.readAsDataURL(file);
      setSelectedPicture(file);
    },
    []
  );

  const onCropComplete = useCallback(
    (_: any, croppedAreaPixelsParam: { x: number; y: number; width: number; height: number }) => {
      setCroppedAreaPixels(croppedAreaPixelsParam);
    },
    []
  );

  const saveCroppedImage = useCallback(async () => {
    if (!croppingImage || !croppedAreaPixels) return;

    try {
      const croppedBlob = await getCroppedImg(croppingImage, croppedAreaPixels);
      const croppedFile = new File([croppedBlob], 'profile.jpg', { type: 'image/jpeg' });
      setSelectedPicture(croppedFile);
      setProfileImage(URL.createObjectURL(croppedFile));
      setCroppingImage(null);
      alert(t('프로필 이미지가 성공적으로 변경되었습니다.'));
    } catch (error) {
      console.error(error);
      alert(t('프로필 이미지 변경에 실패했습니다.'));
    }
  }, [croppingImage, croppedAreaPixels, t]);

  const cancelCropping = useCallback(() => {
    setCroppingImage(null);
    setSelectedPicture(null);
  }, []);

  const handleNicknameSave = useCallback(async () => {
    if (!userId) return;

    if (!canChangeNickname && nextNicknameChangeDate) {
      alert(
        `닉네임은 3개월마다 변경할 수 있습니다. (${nextNicknameChangeDate.toLocaleDateString()}까지 변경 불가)`
      );
      return;
    }

    try {
      await updateUser(userId, {
        nickname: newNickname.trim() || nickname,
        picture: selectedPicture,
        sexual: seeSexual,
        social: seeSocial,
      });

      setNickname(newNickname.trim() || nickname);
      setIsNicknameEditable(false);
      setSelectedPicture(null);
      setNicknameLastChanged(new Date());
      alert(t('프로필이 성공적으로 변경되었습니다.'));
    } catch (error) {
      console.error('프로필 변경 실패:', error);
      alert(t('프로필 변경에 실패하였습니다.'));
    }
  }, [userId, newNickname, nickname, selectedPicture, seeSexual, seeSocial, canChangeNickname, nextNicknameChangeDate, t]);


  return (
    <div className="w-full">
      <div className="flex flex-col items-start mb-6 w-full max-w-[270px]">
        <div className="relative mb-4 w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32">
          <Image
            src={profileImage}
            alt="프로필 이미지"
            fill
            sizes="(max-width: 640px) 6rem, (max-width: 768px) 7rem, 8rem"
            className="object-cover rounded-full cursor-pointer"
            onClick={handlePictureClick}
            priority
          />

          {/* 파일 업로드: 접근성 고려해 label 사용 */}
          <input
            id="avatar-input"
            type="file"
            className="hidden"
            ref={fileInputRef}
            accept="image/*"
            onChange={handlePictureChange}
          />
          <label
            htmlFor="avatar-input"
            className="absolute -bottom-1 -right-1 flex items-center justify-center w-8 h-8 rounded-full bg-white shadow cursor-pointer ring-1 ring-black/5 hover:ring-black/10"
            aria-label="프로필 사진 변경"
          >
            <i className="material-icons !text-[1.1rem] !leading-[1.1rem]">camera_alt</i>
          </label>
        </div>

        {/* Crop 모달 */}
        {croppingImage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
            <div className="w-full max-w-xs sm:max-w-sm aspect-square bg-white rounded-xl overflow-hidden relative">
              <Cropper
                image={croppingImage}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3">
              <button
                className="bg-ara_red text-white px-4 py-2 rounded-lg shadow-sm"
                onClick={saveCroppedImage}
              >
                {t('적용')}
              </button>
              <button
                className="bg-gray-500 text-white px-4 py-2 rounded-lg shadow-sm"
                onClick={cancelCropping}
              >
                {t('취소')}
              </button>
            </div>
          </div>
        )}

        {/* 닉네임/이메일 */}
        <div className="flex flex-col items-start mt-2 w-full">
          {!isNicknameEditable ? (
            <div className="flex items-center max-w-full">
              <div className="text-[18px] sm:text-[20px] font-extrabold truncate max-w-[70vw] lg:max-w-[240px]">
                {nickname}
              </div>
              <button
                type="button"
                className="ml-1 text-gray-600 hover:text-gray-800"
                onClick={() => setIsNicknameEditable(true)}
                aria-label="닉네임 편집"
              >
                <i className="material-icons !text-[1.2rem] !leading-[1.2rem]">create</i>
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-start gap-2 w-full">
              <input
                value={newNickname}
                onChange={(e) => setNewNickname(e.target.value)}
                className="w-full max-w-[260px] sm:max-w-[300px] md:max-w-[340px] h-9 text-[14px] sm:text-[15px] border border-gray-300 rounded-full px-3 shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
              />
              {!canChangeNickname && nextNicknameChangeDate && (
                <div className="text-xs sm:text-sm text-red-500">
                  닉네임은 3개월마다 변경할 수 있습니다. ({nextNicknameChangeDate.toLocaleDateString()}까지 변경 불가)
                </div>
              )}
              <div className="flex gap-2">
                <button
                  className="px-3 py-[6px] text-white text-sm font-semibold rounded-full bg-[#E52933] hover:bg-[#cc202b] transition"
                  onClick={handleNicknameSave}
                >
                  {t('확인')}
                </button>
                <button
                  className="px-3 py-[6px] text-gray-700 text-sm font-semibold rounded-full bg-gray-100 hover:bg-gray-200 transition"
                  onClick={() => setIsNicknameEditable(false)}
                >
                  {t('취소')}
                </button>
              </div>
            </div>
          )}

          <div className="mt-1 text-[13px] sm:text-[14px] text-gray-500 font-medium truncate max-w-[70vw] lg:max-w-[240px] break-all">
            {email}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;