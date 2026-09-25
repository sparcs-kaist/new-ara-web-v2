'use client';

import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

interface MessageContextMenuProps {
    text?: string;
    canDelete: boolean;
    /** Extra rows between 복사하기 and 삭제하기 (e.g. editing a delivery order). */
    actions?: { label: string; onSelect: () => void; danger?: boolean }[];
    onDelete: () => void;
    onClose: () => void;
}

export const copyText = async (text: string) => {
    try {
        await navigator.clipboard.writeText(text);
    } catch {
        // clipboard API가 없거나 거부되는 환경(비보안 컨텍스트 등) 대비
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
    }
};

const MessageContextMenu: React.FC<MessageContextMenuProps> = ({ text, canDelete, actions = [], onDelete, onClose }) => {
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

    const canCopy = typeof text === 'string' && text.length > 0;
    if (!canCopy && !canDelete && actions.length === 0) return null;

    const handleCopyClick = async () => {
        if (canCopy) await copyText(text);
        onClose();
    };

    const handleDeleteClick = () => {
        onDelete();
        onClose();
    };

    const rowClass = 'flex h-14 w-full items-center px-6 text-left text-[16px] rounded-none';

    const menuContent = (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 px-6" onClick={onClose}>
            <div
                role="dialog"
                aria-modal="true"
                className="w-full max-w-[320px] overflow-hidden rounded-[20px] bg-white py-2"
                onClick={(e) => e.stopPropagation()}
            >
                {canCopy && (
                    <button type="button" className={`${rowClass} text-black`} onClick={handleCopyClick}>
                        복사하기
                    </button>
                )}
                {actions.map(({ label, onSelect, danger }) => (
                    <button
                        key={label}
                        type="button"
                        className={`${rowClass} ${danger ? 'text-ara_red' : 'text-black'}`}
                        onClick={() => {
                            onSelect();
                            onClose();
                        }}
                    >
                        {label}
                    </button>
                ))}
                {canDelete && (
                    <button type="button" className={`${rowClass} text-ara_red`} onClick={handleDeleteClick}>
                        삭제하기
                    </button>
                )}
            </div>
        </div>
    );

    // document.body가 존재할 때만 portal을 생성
    if (typeof window !== 'undefined') {
        return createPortal(menuContent, document.body);
    }
    return null;
};

export default MessageContextMenu;
