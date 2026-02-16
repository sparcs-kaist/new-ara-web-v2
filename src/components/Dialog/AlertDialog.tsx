import React, { useEffect } from 'react';

interface DialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    isDestructive?: boolean; // 위험 작업 시 버튼 색상 변경용
}

const AlertDialog = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    confirmText = "확인",
    cancelText = "취소",
    isDestructive = false,
}: DialogProps) => {

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
                className="absolute inset-0 bg-black/50 transition-opacity"
                onClick={onClose}
            />

            <div className="relative z-10 w-full max-w-sm overflow-hidden rounded-xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in duration-200">

                <button
                    onClick={onClose}
                    className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
                >
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                <div className="mb-6">
                    <h3 className="text-xl font-bold text-gray-900">{title}</h3>
                    <p className="mt-3 text-sm font-medium text-gray-700 leading-6">
                        {description}
                    </p>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 rounded-lg border border-gray-300 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                        className={`flex-1 rounded-lg py-2.5 text-sm font-medium text-white transition-colors ${isDestructive
                            ? 'bg-red-500 hover:bg-red-600'
                            : 'bg-red-600 hover:bg-red-700'
                            }`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AlertDialog;