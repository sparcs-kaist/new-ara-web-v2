import React from "react";

export default function ReplyEditor({
    isNested = true,
    isEditing = false, // 수정 모드 prop 추가
    content,
    onContentChange,
    onSubmit,
    onCancel,
}: {
    isNested?: boolean;
    isEditing?: boolean; // prop 타입 추가
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
                    no-scrollbar 
                "
                style={{
                    height: "auto",
                    minHeight: (isNested || isEditing) ? "72px" : "40px",
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
                    {isEditing ? "수정" : "등록"}
                </button>
                {/* 수정 모드일 때도 취소 버튼이 보이도록 조건 변경 */}
                {(isNested || isEditing) && onCancel && (
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