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
                    border-[1.5px]
                    border-gray-300
                    bg-gray-20
                    rounded-[8px]
                    focus:outline-none
                    focus:ring-0
                    no-scrollbar
                    placeholder-gray-500 
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
                placeholder="댓글을 입력해 주세요"
            />
            <div className="flex flex-col gap-[4px] justify-start shrink-0">
                <button
                    className="flex py-1 px-4 rounded-[16px] text-sm font-medium bg-white text-[#e15858] border-[1.5px] border-[#e15858] whitespace-nowrap hover:bg-[#ed3a3a]/10"
                    onClick={onSubmit}
                >
                    {isEditing ? "수정" : "등록"}
                </button>
                {/* 수정 모드일 때도 취소 버튼이 보이도록 조건 변경 */}
                {(isNested || isEditing) && onCancel && (
                    <button
                        className="flex py-1 px-4 rounded-[16px] text-sm font-medium text-gray-500 border-[1.5px] border-gray-500 whitespace-nowrap hover:bg-gray-100"
                        onClick={onCancel}
                    >
                        취소
                    </button>
                )}
            </div>
        </div >
    );
}