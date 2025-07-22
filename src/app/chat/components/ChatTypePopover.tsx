import React from 'react';
import Image from 'next/image';

type Props = {
    onSelect: (type: 'DM' | 'GROUP') => void;
    onClose: () => void;
};

export default function ChatTypePopover({ onSelect, onClose }: Props) {
    return (
        <div className="absolute top-10 right-0 bg-white shadow-lg rounded-lg border z-50 w-36">
            <button
                className="flex items-center w-full px-4 py-3 hover:bg-gray-100 transition"
                onClick={() => { onSelect('DM'); onClose(); }}
            >
                <span className="font-medium text-gray-800">1:1 채팅</span>
            </button>
            <button
                className="flex items-center w-full px-4 py-3 hover:bg-gray-100 transition"
                onClick={() => { onSelect('GROUP'); onClose(); }}
            >
                <span className="font-medium text-gray-800">단체 채팅</span>
            </button>
        </div>
    );
}