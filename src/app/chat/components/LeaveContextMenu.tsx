'use client';

import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

interface LeaveContextMenuProps {
    x: number;
    y: number;
    onClose: () => void;
    isOwner: boolean;
    onLeave: () => void;
    onBlockAndLeave: () => void;
    onDelete: () => void;
}

const LeaveContextMenu: React.FC<LeaveContextMenuProps> = ({ x, y, onClose, isOwner, onLeave, onBlockAndLeave, onDelete }) => {
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    const menuContent = (
        <div
            ref={menuRef}
            className="absolute z-50 bg-white border border-gray-200 rounded-md shadow-lg py-1 w-56"
            style={{ top: y, left: x, transform: 'translateY(-100%)' }}
        >
            <ul>
                {isOwner ? (
                    // 방장일 경우: 삭제 옵션만 표시
                    <li>
                        <button
                            onClick={() => { onDelete(); onClose(); }}
                            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                        >
                            <span className='font-medium'>채팅방 삭제하기</span>
                        </button>
                    </li>
                ) : (
                    // 일반 멤버일 경우: 나가기, 차단하고 나가기 옵션 표시
                    <>
                        <li>
                            <button
                                onClick={() => { onLeave(); onClose(); }}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                            >
                                <span className='font-medium'>채팅방 나가기</span>
                            </button>
                        </li>
                        <li>
                            <button
                                onClick={() => { onBlockAndLeave(); onClose(); }}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                            >
                                <span className='font-medium'>차단하고 나가기</span>
                            </button>
                        </li>
                    </>
                )}
            </ul>
        </div>
    );

    if (typeof window !== 'undefined') {
        return createPortal(menuContent, document.body);
    }
    return null;
};

export default LeaveContextMenu;