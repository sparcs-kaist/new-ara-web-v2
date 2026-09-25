'use client';

import { useEffect, useState } from 'react';
import { BottomSheet, CheckIcon, ConfirmDialog } from '@/app/web_view/_components';
import { CtaButton } from '@/app/web_view/Delivery/_components/BottomCta';
import { Body } from '@/app/web_view/Delivery/_components/DeliveryActionDialog';
import { apiDetail } from '@/lib/api/delivery';
import { isAlreadyReported, reportChat } from '@/lib/api/report';
import type { ChatReportTarget, ReportType } from '@/lib/types/report';

export interface ReportSubject {
    target: ChatReportTarget;
    /** 익명2의 메시지, 익명2 */
    label: string;
    /** A message's text, or 사진/파일. */
    preview?: string;
}

const REASONS: { type: ReportType; label: string }[] = [
    { type: 'insult', label: '욕설·비방·모욕' },
    { type: 'violation_of_code', label: '커뮤니티 강령 위반·불쾌한 내용' },
    { type: 'impersonation', label: '사칭' },
    { type: 'spam', label: '스팸·광고' },
    { type: 'others', label: '기타' },
];
const MAX_CONTENT = 500;

export default function ReportSheet({ subject, onClose }: { subject: ReportSubject | null; onClose: () => void }) {
    // The last subject stays so the sheet keeps its content while it slides out.
    const [shown, setShown] = useState<ReportSubject | null>(null);
    const [type, setType] = useState<ReportType | null>(null);
    const [content, setContent] = useState('');
    const [confirming, setConfirming] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [done, setDone] = useState<string | null>(null);
    if (subject && subject !== shown) {
        setShown(subject);
        setType(null);
        setContent('');
        setConfirming(false);
        setError(null);
        setDone(null);
    }

    useEffect(() => {
        if (!done || !subject) return;
        const t = window.setTimeout(onClose, 1500);
        return () => window.clearTimeout(t);
    }, [done, subject, onClose]);

    const valid = type !== null && (type !== 'others' || content.trim() !== '');

    const submit = async () => {
        if (!shown || !type) return;
        setConfirming(false);
        setSubmitting(true);
        setError(null);
        try {
            await reportChat(shown.target, type, content.trim());
            setDone('신고가 접수됐어요');
        } catch (e) {
            if (isAlreadyReported(e)) setDone(apiDetail(e));
            else setError(apiDetail(e));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <>
            {/* Back while the confirm is up closes only the confirm. */}
            <BottomSheet open={!!subject} onClose={confirming ? () => setConfirming(false) : onClose} title="신고하기">
                {done ? (
                    <div className="flex flex-col items-center px-5 pt-2 text-center">
                        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-ara_red text-white">
                            <CheckIcon size={28} />
                        </span>
                        <p className="mt-4 text-[18px] font-semibold text-black">{done}</p>
                        <p className="mt-1 text-[14px] text-[#646464]">운영진이 확인한 뒤 조치해요.</p>
                        <div className="mt-6 w-full">
                            <CtaButton onClick={onClose}>닫기</CtaButton>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="px-5 pb-3">
                            <p className="text-[14px] text-[#646464]">{shown?.label}</p>
                            {shown?.preview && <p className="mt-1 truncate text-[13px] text-[#999999]">{shown.preview}</p>}
                        </div>
                        <ul className="border-t border-[#F0F0F0] py-1">
                            {REASONS.map((r) => (
                                <li key={r.type}>
                                    <button
                                        type="button"
                                        aria-pressed={r.type === type}
                                        onClick={() => setType(r.type)}
                                        className="flex h-[46px] w-full items-center justify-between px-5 text-left text-[15px] text-black"
                                    >
                                        <span className={r.type === type ? 'font-semibold' : undefined}>{r.label}</span>
                                        {r.type === type && <CheckIcon size={20} className="text-ara_red" />}
                                    </button>
                                </li>
                            ))}
                        </ul>
                        <div className="space-y-3 border-t border-[#F0F0F0] px-5 pt-4">
                            <label className="block rounded-[10px] bg-[#F6F6F6] px-4 py-3">
                                <textarea
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    maxLength={MAX_CONTENT}
                                    rows={3}
                                    placeholder={`자세한 내용 (${type === 'others' ? '필수' : '선택'})`}
                                    className="block w-full resize-none bg-transparent text-[15px] text-black placeholder:text-[#BBBBBB] focus:outline-none"
                                />
                                <span className="mt-1 block text-right text-[13px] text-[#BBBBBB]">
                                    {content.length}/{MAX_CONTENT}
                                </span>
                            </label>
                            <p className="break-keep rounded-[10px] bg-[#FDF0F0] px-4 py-3 text-[13px] leading-5 text-ara_red">
                                신고는 익명으로 접수되며 상대에게 신고자가 보이지 않아요. 허위·반복 신고는 이용 제한 사유가 될 수 있으니
                                신중히 접수해 주세요.
                            </p>
                            {error && <p className="text-[13px] text-ara_red">{error}</p>}
                            <CtaButton disabled={!valid || submitting} onClick={() => setConfirming(true)}>
                                신고 접수하기
                            </CtaButton>
                        </div>
                    </>
                )}
            </BottomSheet>

            {subject && confirming && (
                <ConfirmDialog
                    title="신고를 접수할까요?"
                    secondary={{ label: '닫기', onClick: () => setConfirming(false) }}
                    primary={{ label: '접수하기', onClick: submit }}
                    onClose={() => setConfirming(false)}
                >
                    <Body>접수 후에는 취소할 수 없어요.</Body>
                </ConfirmDialog>
            )}
        </>
    );
}
