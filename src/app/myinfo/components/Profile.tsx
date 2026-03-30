"use client";
import Image from "next/image";
import { useTranslation } from "react-i18next";
import React, { useState, useRef, useEffect, useCallback } from "react";
import Cropper from "react-easy-crop";
import { updateUser } from "@/lib/api/user";
import { useMe } from "@/lib/query/user";

const MAX_SIZE_MB = 3; // 최대 업로드 용량 제한

// Helper: image를 로드해서 canvas로 자르기
const createImage = (url: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new window.Image(); // window.Image 로 명확히 지정
    img.addEventListener("load", () => resolve(img));
    img.addEventListener("error", (error) => reject(error));
    img.setAttribute("crossOrigin", "anonymous");
    img.src = url;
  });

const getCroppedImg = async (
  imageSrc: string,
  crop: { x: number; y: number; width: number; height: number },
) => {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  canvas.width = crop.width;
  canvas.height = crop.height;
  const ctx = canvas.getContext("2d");

  if (!ctx) throw new Error("Failed to get canvas context");

  ctx.drawImage(
    image,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    crop.width,
    crop.height,
  );

  return new Promise<Blob>((resolve) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
    }, "image/jpeg");
  });
};

const Profile = () => {
  const { t } = useTranslation();

  const [userId, setUserId] = useState<number | null>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [newNickname, setNewNickname] = useState("");
  const [isNicknameEditable, setIsNicknameEditable] = useState(false);
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
  const { data } = useMe();

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setUserId(data.user);
        setProfileImage(data.picture || null);
        setEmail(data.email || "");
        setNickname(data.nickname || "");
        setNewNickname(data.nickname || "");
        setSeeSexual(data.see_sexual);
        setSeeSocial(data.see_social);
      } catch (error) {
        console.error("프로필 정보 로딩 실패", error);
      }
    };
    loadProfile();
  }, []);

  const handlePictureClick = () => {
    fileInputRef.current?.click();
  };

  // 파일 선택 시 크기 체크 + crop 모달 오픈
  const handlePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        alert(`이미지 크기는 최대 ${MAX_SIZE_MB}MB 이내여야 합니다.`);
        return;
      }
      const imageUrl = URL.createObjectURL(file);
      setCroppingImage(imageUrl); // crop 모달용 이미지 세팅
    }
  };

  const onCropComplete = useCallback(
    (
      croppedArea: { x: number; y: number; width: number; height: number },
      croppedAreaPixels: {
        x: number;
        y: number;
        width: number;
        height: number;
      },
    ) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    [],
  );

  // crop 완료 후 저장 처리 및 서버 업로드
  const saveCroppedImage = async () => {
    if (!croppedAreaPixels || !croppingImage) return;

    try {
      const croppedBlob = await getCroppedImg(croppingImage, croppedAreaPixels);
      const croppedFile = new File([croppedBlob], "cropped.jpg", {
        type: "image/jpeg",
      });
      setSelectedPicture(croppedFile);
      setProfileImage(URL.createObjectURL(croppedFile)); // crop 결과 미리보기
      setCroppingImage(null); // 모달 닫기

      if (!userId) return;

      const updatedData = await updateUser(userId, {
        nickname: newNickname.trim() || nickname,
        picture: croppedFile,
        sexual: seeSexual,
        social: seeSocial,
      });
      setProfileImage(updatedData.picture);
      alert(t("프로필 이미지가 성공적으로 변경되었습니다."));
    } catch (error) {
      console.error("프로필 이미지 변경 실패:", error);
      alert(t("프로필 이미지 변경에 실패하였습니다."));
    }
  };

  // crop 모달 취소
  const cancelCropping = () => {
    setCroppingImage(null);
  };

  const handleNicknameSave = async () => {
    if (!userId) return;

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
      alert(t("프로필이 성공적으로 변경되었습니다."));
    } catch (error) {
      console.error("프로필 변경 실패:", error);
      alert(t("프로필 변경에 실패하였습니다."));
    }
  };

  const handleNicknameCancel = () => {
    setNewNickname(nickname);
    setIsNicknameEditable(false);
    if (selectedPicture) {
      setProfileImage(profileImage); // 원래 이미지로 복원
      setSelectedPicture(null);
    }
  };

  return (
    <div className="flex flex-col items-center mb-[24px]">
      <div className="relative mb-[24px]">
        {profileImage ? (
          <Image
            src={profileImage}
            width={128}
            height={128}
            style={{ objectFit: "cover", borderRadius: "50%" }} // 원형 유지
            alt="Profile Image"
            onClick={handlePictureClick}
            className="cursor-pointer"
          />
        ) : (
          <div className="w-[128px] h-[128px] rounded-full bg-gray-100 animate-pulse"></div>
        )}
        <input
          type="file"
          className="hidden"
          ref={fileInputRef}
          accept="image/*"
          onChange={handlePictureChange}
        />
        <a
          className="absolute bottom-0 right-0 flex items-center justify-center w-[2rem] h-[2rem] rounded-full bg-white cursor-pointer"
          onClick={handlePictureClick}
        >
          <i className="material-icons !text-[1.3rem] !leading-[1.3rem]">
            camera_alt
          </i>
        </a>
      </div>

      {/* Crop 모달 */}
      {croppingImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-70 flex flex-col items-center justify-center z-50"
          style={{ minWidth: 320 }}
        >
          <div className="relative w-[320px] h-[320px] bg-white rounded-lg overflow-hidden">
            <Cropper
              image={croppingImage}
              crop={crop}
              zoom={zoom}
              aspect={1} // 1:1 비율 고정 (정사각형)
              cropShape="round" // 둥근 크롭 영역 표시
              showGrid={false}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
          </div>
          <div className="mt-4 space-x-4">
            <button
              className="bg-ara_red text-white px-4 py-2 rounded"
              onClick={saveCroppedImage}
            >
              {t("적용")}
            </button>
            <button
              className="bg-gray-400 text-white px-4 py-2 rounded"
              onClick={cancelCropping}
            >
              {t("취소")}
            </button>
          </div>
        </div>
      )}
      {nickname && email ? (
        <div className="flex flex-col items-center justify-between">
          {!isNicknameEditable ? (
            <div className="flex flex-row items-center">
              <div className="text-[20px] font-extrabold truncate inline-block">
                {nickname}
              </div>
              <a
                className="ml-1 flex items-center cursor-pointer"
                onClick={() => setIsNicknameEditable(true)}
              >
                <i className="material-icons !text-[1.3rem] !leading-[1.3rem]">
                  create
                </i>
              </a>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-2">
              <input
                value={newNickname}
                onChange={(e) => setNewNickname(e.target.value)}
                className="w-[150px] h-[28px] text-[15px] text-center font-normal border border-gray-300 rounded-full px-3 shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
              />
              <div className="w-[100%] flex space-x-1">
                <button
                  className="w-[100%] px-3 py-[5px] text-white text-sm font-semibold rounded-full bg-[#E52933] hover:bg-[#cc202b] transition duration-200"
                  onClick={handleNicknameSave}
                >
                  {t("확인")}
                </button>
                <button
                  className="w-[100%] px-3 py-[5px] text-gray-600 text-sm font-semibold rounded-full bg-gray-100 hover:bg-gray-200 transition duration-200"
                  onClick={handleNicknameCancel}
                >
                  {t("취소")}
                </button>
              </div>
            </div>
          )}
          <div className="text-[16px] text-gray-500 font-medium truncate">
            {email}
          </div>
        </div>
      ) : (
        <div className="w-[250px] h-[54px] bg-gray-100 animate-pulse rounded-3xl inline-block"></div>
      )}
    </div>
  );
};

export default Profile;
