/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import TextareaAutosize from "react-textarea-autosize";
import { sendMessage, sendAttachmentMessage } from "@/lib/api/chat";
import { uploadAttachments } from "@/lib/api/post";
import { chatSocket } from "@/lib/socket/chat";
import {
  CameraIcon,
  ClipBadgeIcon,
  Close2Icon,
  ImageBadgeIcon,
  PlusIcon,
  SendIcon,
} from "@/app/web_view/_components/icons";

interface ChatInputProps {
  roomId: number;
  myId: number | null; // myId prop 추가
  onMessageSent: () => void;
  compact?: boolean; // 웹뷰 전용 좁은 폭 컴포저
}

export default function ChatInput({
  roomId,
  myId,
  onMessageSent,
  compact = false,
}: ChatInputProps) {
  const [input, setInput] = useState("");
  const [sheetMounted, setSheetMounted] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [dragY, setDragY] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [pending, setPending] = useState<null | {
    id: number;
    url: string;
    type: "IMAGE" | "FILE";
    name?: string;
  }>(null);
  const [isUploading, setIsUploading] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasSentTypingStartRef = useRef(false);
  const sheetCloseTimerRef = useRef<NodeJS.Timeout | null>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef({
    startY: 0,
    height: 0,
    dy: 0,
    lastY: 0,
    lastT: 0,
    vy: 0,
  });

  // 소켓으로 타이핑 이벤트 전송
  const sendTypingEvent = (type: "typing_start" | "typing_stop") => {
    if (chatSocket.isConnected?.() && myId) {
      // myId가 있을 때만 전송
      chatSocket.send?.({ type, user_id: myId });
    }
  };

  // 입력값이 변경될 때마다 타이핑 상태 관리
  useEffect(() => {
    if (input.trim().length > 0 && !hasSentTypingStartRef.current) {
      sendTypingEvent("typing_start");
      hasSentTypingStartRef.current = true;
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      if (hasSentTypingStartRef.current) {
        sendTypingEvent("typing_stop");
        hasSentTypingStartRef.current = false;
      }
    }, 3000); // 3초 후 '입력 중' 상태 해제

    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [input, myId]); // 의존성 배열에 myId 추가

  const handleSend = async () => {
    if (!roomId || (input.trim() === "" && !pending)) return;
    closeSheet();

    // 메시지 전송 시 즉시 '입력 중' 상태 해제
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    if (hasSentTypingStartRef.current) {
      sendTypingEvent("typing_stop");
      hasSentTypingStartRef.current = false;
    }

    try {
      if (pending) {
        await sendAttachmentMessage(
          roomId,
          pending.type,
          pending.url,
          pending.id,
        );
        setPending(null);
      } else {
        await sendMessage(roomId, input);
        setInput("");
      }
      textareaRef.current?.focus();
      onMessageSent();
    } catch (err: any) {
      alert(err.message || "메시지 전송 실패");
    }
  };

  const pickAndUpload = async (file: File, kind: "IMAGE" | "FILE") => {
    setIsUploading(true);
    try {
      const resp = await uploadAttachments({ file });
      const { id, file: url } = Array.isArray(resp) ? resp[0].data : resp.data;
      setPending({ id, url, type: kind, name: file.name });
    } catch (e: any) {
      alert(e?.message || "파일 업로드 실패");
    } finally {
      setIsUploading(false);
    }
  };

  const onPickImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) pickAndUpload(f, "IMAGE");
    e.target.value = "";
  };

  const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) pickAndUpload(f, "FILE");
    e.target.value = "";
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Ignore Enter while composing (macOS IME, etc.)
    // Safari/mac can also report composition on nativeEvent
    // @ts-expect-error - React types don't include nativeEvent.isComposing
    const composing = e.isComposing || e.nativeEvent?.isComposing;
    if (composing) return;

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // 마운트한 다음 프레임에 열어야 시트가 아래에서 올라온다
  useEffect(() => {
    if (!sheetMounted) return;
    let inner = 0;
    const outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(() => setSheetOpen(true));
    });
    return () => {
      cancelAnimationFrame(outer);
      cancelAnimationFrame(inner);
    };
  }, [sheetMounted]);

  useEffect(
    () => () => {
      if (sheetCloseTimerRef.current) clearTimeout(sheetCloseTimerRef.current);
    },
    [],
  );

  const openSheet = () => {
    if (sheetCloseTimerRef.current) {
      clearTimeout(sheetCloseTimerRef.current);
      sheetCloseTimerRef.current = null;
    }
    if (document.activeElement === textareaRef.current) {
      textareaRef.current?.blur();
    }
    if (sheetMounted) setSheetOpen(true);
    else setSheetMounted(true);
  };

  const unmountSheet = () => {
    if (sheetCloseTimerRef.current) {
      clearTimeout(sheetCloseTimerRef.current);
      sheetCloseTimerRef.current = null;
    }
    setSheetMounted(false);
  };

  const closeSheet = () => {
    if (!sheetOpen) return;
    setSheetOpen(false);
    if (sheetCloseTimerRef.current) clearTimeout(sheetCloseTimerRef.current);
    sheetCloseTimerRef.current = setTimeout(unmountSheet, 400);
  };

  // 아래로 끌어 닫기: 높이의 1/3을 넘기거나 빠르게 놓으면 닫는다
  const onSheetTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    const y = e.touches[0].clientY;
    dragRef.current = {
      startY: y,
      height: sheetRef.current?.getBoundingClientRect().height ?? 0,
      dy: 0,
      lastY: y,
      lastT: e.timeStamp,
      vy: 0,
    };
    setDragging(true);
  };

  const onSheetTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    const d = dragRef.current;
    const y = e.touches[0].clientY;
    const dt = e.timeStamp - d.lastT;
    if (dt > 0) d.vy = (y - d.lastY) / dt;
    d.lastY = y;
    d.lastT = e.timeStamp;
    d.dy = Math.max(0, y - d.startY);
    setDragY(d.dy);
  };

  const onSheetTouchEnd = () => {
    const { dy, height, vy } = dragRef.current;
    setDragging(false);
    setDragY(0);
    if (dy > 8 && (dy > height / 3 || vy > 0.5)) closeSheet();
    dragRef.current.dy = 0;
  };

  const onSheetTouchCancel = () => {
    setDragging(false);
    setDragY(0);
  };

  const pickFrom = (ref: React.RefObject<HTMLInputElement | null>) => {
    closeSheet();
    ref.current?.click();
  };

  const hiddenFileInputs = (
    <>
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onPickImage}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept=".txt,.docx,.doc,.pptx,.ppt,.pdf,.hwp,.zip,.7z,.png,.jpg,.jpeg,.gif"
        className="hidden"
        onChange={onPickFile}
      />
    </>
  );

  if (compact) {
    const canSend = !isUploading && (input.trim() !== "" || !!pending);
    const scrimOpacity =
      dragging && dragRef.current.height > 0
        ? Math.max(0, 1 - dragY / dragRef.current.height)
        : 1;
    const attachRows = [
      {
        label: "사진",
        color: "bg-ara_red",
        Icon: ImageBadgeIcon,
        inputRef: imageInputRef,
      },
      {
        label: "카메라",
        color: "bg-ara_blue",
        Icon: CameraIcon,
        inputRef: cameraInputRef,
      },
      {
        label: "파일",
        color: "bg-[#636363]",
        Icon: ClipBadgeIcon,
        inputRef: fileInputRef,
      },
    ];

    return (
      <div className="shrink-0">
        {pending && (
          <div className="flex items-center gap-[8px] px-[10px] py-[8px] border-t border-[#F0F0F0]">
            {pending.type === "IMAGE" ? (
              <Image
                src={pending.url}
                alt={pending.name || "image"}
                width={64}
                height={64}
                className="w-[64px] h-[64px] rounded-[10px] object-cover"
              />
            ) : (
              <div className="min-w-0 flex items-center gap-[6px] rounded-[10px] bg-[#F6F6F6] px-[10px] py-[6px] text-[14px] font-medium text-black">
                <ClipBadgeIcon size={18} className="text-[#636363]" />
                <span className="truncate">{pending.name || "파일"}</span>
              </div>
            )}
            <button
              type="button"
              aria-label="첨부 취소"
              className="shrink-0 w-[24px] h-[24px] flex items-center justify-center text-[#9E9E9E]"
              onClick={() => setPending(null)}
            >
              <Close2Icon size={16} />
            </button>
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
          }}
          className="flex items-end gap-[7px] border-t border-[#F0F0F0] px-[10px] py-[7px] min-h-[50px]"
        >
          <button
            type="button"
            aria-label="첨부"
            className={`shrink-0 w-[36px] h-[36px] flex items-center justify-center ${isUploading ? "text-[#BBBBBB]" : "text-[#636363]"}`}
            onClick={openSheet}
            disabled={isUploading}
          >
            <PlusIcon size={32} />
          </button>

          <TextareaAutosize
            ref={textareaRef}
            className="flex-1 min-w-0 resize-none rounded-[10px] bg-[#F6F6F6] px-[10px] py-[8px] text-[16px] font-medium leading-[20px] placeholder:text-[#BBBBBB] focus:outline-none"
            placeholder={pending ? "" : isUploading ? "업로드 중…" : "메시지를 입력하세요"}
            value={input}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              setInput(e.target.value)
            }
            onKeyDown={handleKeyDown}
            onFocus={closeSheet}
            disabled={!!pending || isUploading}
            maxRows={5}
            rows={1}
            // Chromium scrolls an ancestor to reveal the caret on every resize step; the composer rides the column instead.
            style={{ scrollMarginBottom: '-9999px' }}
          />

          <button
            type="button"
            aria-label="전송"
            className={`shrink-0 w-[36px] h-[36px] flex items-center justify-center ${canSend ? "text-ara_red" : "text-[#BBBBBB]"}`}
            onMouseDown={(e) => e.preventDefault()}
            onClick={handleSend}
            disabled={isUploading || (!input.trim() && !pending)}
          >
            <SendIcon size={28} />
          </button>
        </form>

        {sheetMounted &&
          typeof document !== "undefined" &&
          createPortal(
            <>
              <div
                className={`fixed inset-0 z-[70] bg-black/30 ${dragging ? "" : "transition-opacity duration-200"} ${sheetOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
                style={dragging ? { opacity: scrimOpacity } : undefined}
                onClick={closeSheet}
              />
              <div
                ref={sheetRef}
                role="dialog"
                aria-modal="true"
                aria-label="첨부"
                className={`fixed inset-x-0 z-[71] rounded-t-[20px] bg-white ${dragging ? "" : "transition-transform duration-[250ms] ease-out"} ${sheetOpen ? "translate-y-0" : "translate-y-full pointer-events-none"}`}
                style={{
                  bottom: "max(var(--kb-inset, 0px), 0px)",
                  paddingBottom:
                    "calc(8px + max(0px, var(--ara-safe-bottom, env(safe-area-inset-bottom, 0px)) - var(--ara-kb-shrink, 0px) - var(--kb-inset, 0px)))",
                  touchAction: "none",
                  ...(dragY > 0
                    ? { transform: `translateY(${dragY}px)` }
                    : null),
                }}
                onTouchStart={onSheetTouchStart}
                onTouchMove={onSheetTouchMove}
                onTouchEnd={onSheetTouchEnd}
                onTouchCancel={onSheetTouchCancel}
                onTransitionEnd={(e) => {
                  if (e.propertyName === "transform" && !sheetOpen)
                    unmountSheet();
                }}
              >
                <div className="mx-auto mt-[10px] h-[4px] w-[36px] rounded-full bg-[#D9D9D9]" />
                <div className="pt-[6px]">
                  {attachRows.map(({ label, color, Icon, inputRef }) => (
                    <button
                      key={label}
                      type="button"
                      className="flex w-full items-center gap-[16px] px-[20px] h-[64px] text-left active:bg-[#F6F6F6]"
                      onClick={() => {
                        if (dragRef.current.dy > 8) return;
                        pickFrom(inputRef);
                      }}
                    >
                      <span
                        className={`w-[28px] h-[28px] rounded-[8px] flex items-center justify-center text-white ${color}`}
                      >
                        <Icon size={18} />
                      </span>
                      <span className="text-[16px] font-medium text-black">
                        {label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </>,
            document.body,
          )}

        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={onPickImage}
        />
        {hiddenFileInputs}
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        // Prevent native form submit to avoid double-send on Enter (macOS/Safari)
        e.preventDefault();
      }}
      className="flex items-end gap-2 pt-2 border-t"
    >
      <button
        type="button"
        aria-label="파일 첨부"
        title="파일 첨부"
        className="p-2 rounded-full border border-gray-300 hover:bg-gray-100 transition shrink-0 self-end"
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
      >
        <svg
          viewBox="0 0 24 24"
          className="w-5 h-5 text-gray-600"
          fill="none"
          stroke="currentColor"
        >
          <path
            d="M21 12.5l-8.5 8.5a6 6 0 01-8.5-8.5L12 4.5a4 4 0 115.7 5.6l-9 9a2 2 0 11-2.8-2.8l8-8"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      <button
        type="button"
        aria-label="이미지 첨부"
        title="이미지 첨부"
        className="p-2 rounded-full border border-gray-300 hover:bg-gray-100 transition shrink-0 self-end"
        onClick={() => imageInputRef.current?.click()}
        disabled={isUploading}
      >
        <svg
          viewBox="0 0 24 24"
          className="w-5 h-5 text-gray-600"
          fill="none"
          stroke="currentColor"
        >
          <rect
            x="3"
            y="5"
            width="18"
            height="14"
            rx="2"
            ry="2"
            strokeWidth="2"
          />
          <circle cx="9" cy="10" r="2" strokeWidth="2" />
          <path
            d="M21 17l-5-5-4 4-2-2-5 5"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      <div className="flex-1 border rounded-2xl px-2 py-1 bg-white flex flex-col">
        {pending && (
          <div className="m-2 flex items-center gap-2 self-start">
            {pending.type === "IMAGE" ? (
              <Image
                src={pending.url}
                alt={pending.name || "image"}
                width={80}
                height={80}
                className="rounded-md object-cover"
              />
            ) : (
              <div className="px-3 py-2 rounded-md border text-sm flex items-center gap-2">
                <svg
                  viewBox="0 0 24 24"
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                >
                  <path
                    d="M21 12.5l-8.5 8.5a6 6 0 01-8.5-8.5L12 4.5a4 4 0 115.7 5.6l-9 9a2 2 0 11-2.8-2.8l8-8"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span className="truncate max-w-[16rem]">
                  {pending.name || "파일"}
                </span>
              </div>
            )}
            <button
              type="button"
              className="text-xs text-red-500 hover:underline self-start"
              onClick={() => setPending(null)}
            >
              취소
            </button>
          </div>
        )}
        {!pending && (
          <TextareaAutosize
            ref={textareaRef}
            className="w-full px-2 py-1.5 focus:outline-none resize-none bg-transparent disabled:bg-gray-100"
            placeholder={pending ? "" : "메시지를 입력하세요..."}
            value={input}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              setInput(e.target.value)
            }
            onKeyDown={handleKeyDown}
            disabled={!!pending || isUploading}
            maxRows={8}
            rows={1}
          />
        )}
      </div>

      <button
        type="button"
        className="p-2 rounded-full border border-gray-300 hover:bg-gray-100 transition flex items-center justify-center gap-1 disabled:opacity-50 self-end"
        aria-label="메시지 전송"
        onMouseDown={(e) => e.preventDefault()}
        onClick={handleSend}
        disabled={isUploading || (!input.trim() && !pending)}
      >
        <span className="text-sm font-medium text-gray-700">전송</span>
        <Image src="/Send.svg" alt="전송" width={20} height={20} />
      </button>

      {hiddenFileInputs}
    </form>
  );
}
