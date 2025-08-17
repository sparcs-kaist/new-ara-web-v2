/* eslint-disable */
import React, { useState } from "react";

export default function ReplyEditor({ isNested = true, isEditing = false, id }: { isNested?: boolean, isEditing?: boolean, id?: number }) {
    const [text, setText] = useState("");

    return (
        <div className="flex flex-row w-full gap-[8px] mt-3">
            <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={1} // 시작 줄 수
                className="
            w-full
            p-3
            resize-none
            overflow-hidden
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
                    minHeight: "3rem", // 최소 높이 설정
                }}
                onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = "auto"; // 높이 초기화 후
                    target.style.height = `${target.scrollHeight}px`; // 내용에 맞게 높이 설정
                }}
                placeholder="내용을 입력하세요"
            />
            <div className="flex flex-col gap-[4px] justify-end">
                {/* TODO : 여기에 타입 추가 : request type 확인 필요 */}
                {isNested && <button className="flex py-2 px-5 rounded-[8px] text-xs bg-[#E9E9E9] whitespace-nowrap hover:bg-[#B5B5B5]" onClick={() => { setText("") }}>취소</button>}
                <button className="flex py-2 px-5 rounded-[8px] text-xs bg-[#ED3A3A] text-white whitespace-nowrap hover:bg-[#C62626]" onClick={() => { isEditing ? console.log("updated") : console.log("created") }}>등록</button>
            </div>
        </div>
    );
}
