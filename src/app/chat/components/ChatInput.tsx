/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import TextareaAutosize from 'react-textarea-autosize';
import { sendMessage, sendAttachmentMessage } from '@/lib/api/chat';
import { uploadAttachments } from '@/lib/api/post';

interface ChatInputProps {
    roomId: number;
    onMessageSent: () => void;
}

export default function ChatInput({ roomId, onMessageSent }: ChatInputProps) {
    const [input, setInput] = useState('');
    const [pending, setPending] = useState<null | { id: number; url: string; type: 'IMAGE' | 'FILE'; name?: string }>(null);
    const [isUploading, setIsUploading] = useState(false);
    const imageInputRef = useRef<HTMLInputElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleSend = async () => {
        if (!roomId || (input.trim() === '' && !pending)) return;

        try {
            if (pending) {
                await sendAttachmentMessage(roomId, pending.type, pending.url, pending.id);
                setPending(null);
            } else {
                await sendMessage(roomId, input);
                setInput('');
            }
            onMessageSent();
        } catch (err: any) {
            alert(err.message || '메시지 전송 실패');
        }
    };

    const pickAndUpload = async (file: File, kind: 'IMAGE' | 'FILE') => {
        setIsUploading(true);
        try {
            const resp = await uploadAttachments(file);
            const { id, file: url } = Array.isArray(resp) ? resp[0].data : resp.data;
            setPending({ id, url, type: kind, name: file.name });
        } catch (e: any) {
            alert(e?.message || '파일 업로드 실패');
        } finally {
            setIsUploading(false);
        }
    };

    const onPickImage = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (f) pickAndUpload(f, 'IMAGE');
        e.target.value = '';
    };

    const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (f) pickAndUpload(f, 'FILE');
        e.target.value = '';
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <form
            onSubmit={(e) => {
                e.preventDefault();
                handleSend();
            }}
            className="flex items-end gap-2 pt-2 border-t"
        >
            <button
                type="button"
                aria-label="파일 첨부"
                title="파일 첨부"
                className="p-2 rounded-full border border-gray-300 hover:bg-gray-100 transition shrink-0 self-end"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
            >
                <svg viewBox="0 0 24 24" className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor">
                    <path d="M21 12.5l-8.5 8.5a6 6 0 01-8.5-8.5L12 4.5a4 4 0 115.7 5.6l-9 9a2 2 0 11-2.8-2.8l8-8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </button>
            <button
                type="button"
                aria-label="이미지 첨부"
                title="이미지 첨부"
                className="p-2 rounded-full border border-gray-300 hover:bg-gray-100 transition shrink-0 self-end"
                onClick={() => imageInputRef.current?.click()}
                disabled={isUploading}
            >
                <svg viewBox="0 0 24 24" className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor">
                    <rect x="3" y="5" width="18" height="14" rx="2" ry="2" strokeWidth="2" />
                    <circle cx="9" cy="10" r="2" strokeWidth="2" />
                    <path d="M21 17l-5-5-4 4-2-2-5 5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </button>

            <div className="flex-1 border rounded-2xl px-2 py-1 bg-white flex flex-col">
                {pending && (
                    <div className="m-2 flex items-center gap-2 self-start">
                        {pending.type === 'IMAGE' ? (
                            <Image src={pending.url} alt={pending.name || 'image'} width={80} height={80} className="rounded-md object-cover" />
                        ) : (
                            <div className="px-3 py-2 rounded-md border text-sm flex items-center gap-2">
                                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor"><path d="M21 12.5l-8.5 8.5a6 6 0 01-8.5-8.5L12 4.5a4 4 0 115.7 5.6l-9 9a2 2 0 11-2.8-2.8l8-8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                <span className="truncate max-w-[16rem]">{pending.name || '파일'}</span>
                            </div>
                        )}
                        <button type="button" className="text-xs text-red-500 hover:underline self-start" onClick={() => setPending(null)}>취소</button>
                    </div>
                )}
                <TextareaAutosize
                    className="w-full px-2 py-1.5 focus:outline-none resize-none bg-transparent disabled:bg-gray-100"
                    placeholder={pending ? '첨부 파일이 대기 중입니다' : '메시지를 입력하세요...'}
                    value={input}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={!!pending || isUploading}
                    maxRows={8}
                    rows={1}
                />
            </div>

            <button
                type="submit"
                className="p-2 rounded-full border border-gray-300 hover:bg-gray-100 transition flex items-center justify-center gap-1 disabled:opacity-50 self-end"
                aria-label="메시지 전송"
                disabled={isUploading || (!input.trim() && !pending)}
            >
                <span className="text-sm font-medium text-gray-700">전송</span>
                <Image src="/Send.svg" alt="전송" width={20} height={20} />
            </button>

            <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={onPickImage} />
            <input ref={fileInputRef} type="file" accept=".txt,.docx,.doc,.pptx,.ppt,.pdf,.hwp,.zip,.7z,.png,.jpg,.jpeg,.gif" className="hidden" onChange={onPickFile} />
        </form>
    );
}
