import React, { useState } from "react";

export default function ReplyEditor({
    isNested = true,
    content,
    onContentChange,
    onSubmit,
    onCancel,
}: {
    isNested?: boolean;
    content: string;
    onContentChange: (text: string) => void;
    onSubmit: () => void;
    onCancel?: () => void;
}) {
    return (
        <div className="flex flex-row w-full gap-[8px] items-start">
            <textarea
                value={content}
                onChange={(e) => onContentChange(e.target.value)}
                rows={1}
                className="
                    w-full
                    p-3
                    resize-none
                    leading-relaxed
                    text-base
                    border
                    border-[#E9E9E9]
                    bg-[#FAFAFA]
                    rounded-[8px]
                    focus:outline-none
                    focus:ring-0
                "
                style={{
                    height: "auto",
                    minHeight: isNested ? "72px" : "40px", // 답글일 때와 아닐 때 최소 높이 조절
                }}
                onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = "auto";
                    target.style.height = `${target.scrollHeight}px`;
                }}
                placeholder="내용을 입력하세요"
            />
            <div className="flex flex-col gap-[4px] justify-start shrink-0">
                <button
                    className="flex py-2 px-5 rounded-[8px] text-xs bg-[#ED3A3A] text-white whitespace-nowrap hover:bg-[#C62626]"
                    onClick={onSubmit}
                >
                    등록
                </button>
                {isNested && onCancel && (
                    <button
                        className="flex py-2 px-5 rounded-[8px] text-xs bg-[#E9E9E9] whitespace-nowrap hover:bg-[#B5B5B5]"
                        onClick={onCancel}
                    >
                        취소
                    </button>
                )}
            </div>
        </div>
    );
}