/* eslint-disable */

import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom"; // React DOM에서 createPortal 임포트

interface RoomCreateDialogProps {
  open: boolean;
  onClose: () => void;
  onCreate: (room: { title: string; picture: File | null }) => void;
}

const DEFAULT_IMAGES = ["/Chatroom_default1.png", "/Chatroom_default2.png"];
const getRandomDefaultImage = () =>
  DEFAULT_IMAGES[Math.floor(Math.random() * DEFAULT_IMAGES.length)];

async function urlToFile(url: string, filename: string): Promise<File> {
  const res = await fetch(url);
  const blob = await res.blob();
  return new File([blob], filename, { type: blob.type });
}

const RoomCreateDialog: React.FC<RoomCreateDialogProps> = ({
  open,
  onClose,
  onCreate,
}) => {
  const [title, setTitle] = useState("");
  const [picture, setPicture] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>(getRandomDefaultImage());
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!open || !mounted) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPicture(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("채팅방 이름을 입력해 주세요");
      return;
    }
    setError("");
    let pic = picture;
    if (!pic) {
      // 기본 이미지 파일로 변환
      pic = await urlToFile(preview, preview.split("/").pop() || "default.png");
    }
    onCreate({ title: title.trim(), picture: pic });
    setTitle("");
    setPicture(null);
    setPreview(getRandomDefaultImage());
  };

  const handleClose = () => {
    setTitle("");
    setPicture(null);
    setPreview(getRandomDefaultImage());
    setError("");
    onClose();
  };

  // 다이얼로그 내용을 정의
  const dialog = (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
      <div className="bg-white rounded-lg shadow-lg p-6 w-80 relative">
        <h2 className="text-lg font-bold mb-4">채팅방 만들기</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col items-center gap-2">
            <div className="relative">
              <img
                src={preview}
                alt="채팅방 프로필"
                className="rounded-full border bg-white"
                style={{
                  cursor: "pointer",
                  width: "100px",
                  height: "100px",
                  objectFit: "cover",
                }}
                onClick={() => fileInputRef.current?.click()}
              />
              <button
                type="button"
                className="absolute bottom-1 right-1 bg-white rounded-full p-1 shadow hover:bg-gray-100"
                style={{ lineHeight: 0 }}
                onClick={() => fileInputRef.current?.click()}
                tabIndex={-1}
              >
                <span className="material-icons text-gray-500 text-[20px]">
                  camera_alt
                </span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
          </div>
          <div>
            <input
              type="text"
              className="border rounded px-3 py-2 w-full"
              placeholder="채팅방 이름"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (error) setError("");
              }}
              maxLength={30}
            />
            {error && (
              <div className="text-sm font-normal text-[#ed3a3a] mt-1">{error}</div>
            )}
          </div>
          <div className="flex justify-end gap-2 mt-2">
            <button
              type="button"
              className="px-3 py-1 rounded-full border-[1px] font-medium border-gray-300 bg-white text-gray-500
               hover:bg-gray-100 hover:text-black"
              onClick={handleClose}
            >
              취소
            </button>
            <button
              type="submit"
              className="px-3 py-1 rounded-full border-[1px] font-medium border-[#ed3a3a] bg-white text-[#ed3a3a] 
              hover:bg-[#ed3a3a] hover:text-white"
            >
              만들기
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  // Portal을 사용하여 body에 직접 렌더링
  return createPortal(dialog, document.body);
};

export default RoomCreateDialog;