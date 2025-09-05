'use client';

import { useEffect, useRef } from 'react';

interface CommentMenuPopoverProps {
    isMine: boolean;
    onEdit: () => void;
    onDelete: () => void;
    onReport: () => void;
    onClose: () => void;
}

export default function CommentMenuPopover({ isMine, onEdit, onDelete, onReport, onClose }: CommentMenuPopoverProps) {
    const popoverRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        // 이벤트 리스너 등록
        document.addEventListener('mousedown', handleClickOutside);

        // 컴포넌트가 언마운트될 때 이벤트 리스너 제거
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [onClose]); // onClose 함수가 변경될 때만 effect를 다시 실행

    return (
        <div ref={popoverRef} className="absolute right-0 top-full mt-1 w-24 bg-white rounded-md shadow-lg border z-10">
            <ul className="py-1">
                {isMine ? (
                    <>
                        <li>
                            <button
                                onClick={() => { onEdit(); onClose(); }}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                                수정
                            </button>
                        </li>
                        <li>
                            <button
                                onClick={() => { onDelete(); onClose(); }}
                                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                            >
                                삭제
                            </button>
                        </li>
                    </>
                ) : (
                    <li>
                        <button
                            onClick={() => { onReport(); onClose(); }}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                            신고
                        </button>
                    </li>
                )}
            </ul>
        </div>
    );
}