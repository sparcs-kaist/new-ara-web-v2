'use client';

import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

interface MessageContextMenuProps {
    x: number;
    y: number;
    onDelete: () => void;
    onClose: () => void;
}

const MessageContextMenu: React.FC<MessageContextMenuProps> = ({ x, y, onDelete, onClose }) => {
    const menuRef = useRef<HTMLDivElement>(null);

    // 메뉴 바깥을 클릭하면 닫기
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [onClose]);

    // Escape 키를 누르면 닫기
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [onClose]);

    const handleDeleteClick = () => {
        onDelete();
        onClose();
    };

    const menuContent = (
        <div
            ref={menuRef}
            className="absolute z-50 bg-white border border-gray-200 rounded-md shadow-lg py-1"
            style={{ top: y, left: x }}
        >
            <ul>
                <li>
                    <button
                        onClick={handleDeleteClick}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 flex items-center gap-2"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                        <span>삭제하기</span>
                    </button>
                </li>
            </ul>
        </div>
    );

    // document.body가 존재할 때만 portal을 생성
    if (typeof window !== 'undefined') {
        return createPortal(menuContent, document.body);
    }
    return null;
};

export default MessageContextMenu;