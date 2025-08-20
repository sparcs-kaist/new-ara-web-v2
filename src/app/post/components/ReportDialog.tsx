'use client';

import { useState } from 'react';
import { reportComment } from '@/lib/api/post';

const reportReasons = {
    '혐오 발언': 'hate_speech',
    '허가되지 않은 판매글': 'unauthorized_sales_articles',
    '스팸': 'spam',
    '거짓 정보': 'fake_information',
    '명예훼손': 'defamation',
    '기타': 'other',
};

interface ReportDialogProps {
    commentId: number;
    onClose: () => void;
}

export default function ReportDialog({ commentId, onClose }: ReportDialogProps) {
    const [selectedReasons, setSelectedReasons] = useState<string[]>([]);

    const handleCheckboxChange = (reason: string) => {
        setSelectedReasons(prev =>
            prev.includes(reason)
                ? prev.filter(r => r !== reason)
                : [...prev, reason]
        );
    };

    const handleSubmit = async () => {
        if (selectedReasons.length === 0) {
            alert('신고 사유를 하나 이상 선택해주세요.');
            return;
        }
        try {
            const reasonString = selectedReasons.join(',');
            await reportComment(commentId, 'others', reasonString);
            alert('신고가 접수되었습니다.');
            onClose();
        } catch (error: any) {
            console.error('신고 처리 중 오류 발생:', error);

            let errorMessage = '신고 처리 중 오류가 발생했습니다.';
            // API 에러 응답의 data 필드를 직접 확인
            const rawData = error.response?.data;

            if (rawData) {
                // 응답 데이터 자체가 배열인 경우 (e.g., ["이미 신고한 글입니다."])
                if (Array.isArray(rawData) && rawData.length > 0) {
                    errorMessage = rawData[0];
                }
                // 응답 데이터가 객체이고 message 속성을 가지는 경우 (기존 로직)
                else if (rawData.message) {
                    const rawMessage = rawData.message;
                    if (Array.isArray(rawMessage) && rawMessage.length > 0) {
                        errorMessage = rawMessage[0];
                    } else if (typeof rawMessage === 'string') {
                        errorMessage = rawMessage;
                    }
                }
                // 응답 데이터 자체가 문자열인 경우
                else if (typeof rawData === 'string') {
                    errorMessage = rawData;
                }
            }

            alert(errorMessage);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <h2 className="text-xl font-bold mb-4">신고하기</h2>
                <div className="space-y-2">
                    {Object.entries(reportReasons).map(([label, value]) => (
                        <label key={value} className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={selectedReasons.includes(value)}
                                onChange={() => handleCheckboxChange(value)}
                                className="cursor-pointer"
                            />
                            {label}
                        </label>
                    ))}
                </div>
                <div className="flex justify-end gap-4 mt-6">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 transition"
                    >
                        취소
                    </button>
                    <button
                        onClick={handleSubmit}
                        className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition"
                    >
                        신고
                    </button>
                </div>
            </div>
        </div>
    );
}