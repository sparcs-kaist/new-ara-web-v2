'use client';

import { useEffect, useState, type MouseEvent, type ReactNode } from 'react';
import { BottomSheet } from '@/app/web_view/_components/BottomSheet';
import { ConfirmDialog } from '@/app/web_view/_components/ConfirmDialog';
import { getBridge, useIsNative } from '@/app/web_view/_bridge';
import { Body, Rows } from '@/app/web_view/Delivery/_components/DeliveryActionDialog';
import { cancelPaymentRequest, deleteMessage, setPaymentPaid } from '@/lib/api/chat';
import { apiDetail } from '@/lib/api/delivery';
import { formatWon, withSubject } from '@/lib/delivery';
import type { ChatPaymentRequest, ChatPaymentTarget } from '@/lib/types/chat';
import { copyText } from './MessageContextMenu';

// The payer picks their own app every time, like a share sheet. Only Toss can prefill the transfer;
// the other apps just open, so the account is copied first for pasting.
const TRANSFER_APPS: { name: string; url: (bank: string, account: string, amount: number) => string; note: string }[] = [
    {
        name: '토스',
        note: '은행·계좌·금액이 채워져요',
        url: (bank, account, amount) => {
            const q = new URLSearchParams({ bank, accountNo: account.replace(/\D/g, ''), amount: String(amount), origin: 'qr' });
            return `supertoss://send?${q}`;
        },
    },
    { name: '카카오뱅크', note: '앱을 열고 계좌번호를 복사해 둘게요', url: () => 'kakaobank://' },
    { name: 'KB국민은행', note: '앱을 열고 계좌번호를 복사해 둘게요', url: () => 'kbbank://' },
    { name: '신한 SOL뱅크', note: '앱을 열고 계좌번호를 복사해 둘게요', url: () => 'shinhan-sr-ssb://' },
    { name: '우리WON뱅킹', note: '앱을 열고 계좌번호를 복사해 둘게요', url: () => 'newsmartpib://' },
    { name: 'NH올원뱅크', note: '앱을 열고 계좌번호를 복사해 둘게요', url: () => 'nhallonebank://' },
];

type Dialog = 'paid' | 'unpaid' | 'cancel' | 'delete';

interface PaymentRequestCardProps {
    payment: ChatPaymentRequest;
    isHost: boolean;
    canDelete?: boolean;
    onChanged: (next: ChatPaymentRequest | null) => void;
}

export default function PaymentRequestCard({ payment, isHost, canDelete = false, onChanged }: PaymentRequestCardProps) {
    const isNative = useIsNative();
    const [dialog, setDialog] = useState<Dialog | null>(null);
    const [menuOpen, setMenuOpen] = useState(false);
    const [copied, setCopied] = useState(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!copied) return;
        const t = window.setTimeout(() => setCopied(false), 1500);
        return () => window.clearTimeout(t);
    }, [copied]);

    const canceled = payment.canceled_at != null;
    const canCancel = isHost && !canceled && !payment.is_settled;
    const mine = payment.targets.find((t) => t.user.is_mine);
    const amount = mine ? mine.amount : payment.total_amount;
    const paidCount = payment.targets.filter((t) => t.paid_at).length;
    const account = `${payment.bank_name} ${payment.account_number}`;
    const [appSheet, setAppSheet] = useState(false);
    const [appNote, setAppNote] = useState<string | null>(null);
    const openApp = async (app: (typeof TRANSFER_APPS)[number] | null, sendAmount: number) => {
        setAppSheet(false);
        await copyText(account);
        if (!app) return setAppNote('계좌를 복사했어요');
        try {
            await getBridge().request('openExternal', { url: app.url(payment.bank_name, payment.account_number, sendAmount) });
            setAppNote(app.name === '토스' ? null : '계좌를 복사했어요');
        } catch {
            setAppNote(`${app.name} 앱이 없어 계좌만 복사했어요`);
        }
    };
    const subtitle = !mine
        ? `${payment.targets.length}명에게 청구`
        : mine.order_amount != null
          ? `주문 ${formatWon(mine.order_amount)} + 배송비 ${formatWon(mine.delivery_fee_share ?? mine.amount - mine.order_amount)}`
          : `${withSubject(payment.requester.display_name)} 요청`;

    const closeDialog = () => {
        setDialog(null);
        setError(null);
    };

    const run = async (call: () => Promise<ChatPaymentRequest | null>, errorText: (e: unknown) => string = apiDetail) => {
        setBusy(true);
        setError(null);
        try {
            const next = await call();
            setDialog(null);
            onChanged(next);
        } catch (e) {
            setError(errorText(e));
        } finally {
            setBusy(false);
        }
    };
    const errorLine = error && <p className="mt-3 text-[13px] text-ara_red">{error}</p>;

    const openMenu = (e: MouseEvent) => {
        // Long-presses inside the portaled dialogs bubble up here as well.
        if (!e.currentTarget.contains(e.target as Node)) return;
        e.preventDefault();
        e.stopPropagation();
        setMenuOpen(true);
    };
    const pick = (next: Dialog) => {
        setMenuOpen(false);
        setDialog(next);
    };

    return (
        <div
            onContextMenu={canCancel || canDelete ? openMenu : undefined}
            className={`w-[260px] rounded-[15px] border border-[#F0F0F0] p-4 text-left text-black ${canceled ? 'bg-[#F6F6F6]' : 'bg-white'}`}
        >
            <p className={`text-[12px] font-semibold ${canceled ? 'text-[#646464]' : 'text-ara_red'}`}>
                {canceled ? '취소된 정산' : payment.is_settled ? '정산 완료' : '정산 요청'}
            </p>
            <p className={`mt-2 text-[22px] font-bold leading-7 ${canceled ? 'text-[#BBBBBB] line-through' : ''}`}>
                {formatWon(amount)}
            </p>
            <p className={`mt-1 text-[12px] ${canceled ? 'text-[#BBBBBB]' : 'text-[#646464]'}`}>{subtitle}</p>

            {canceled && (
                <div className="mt-3 space-y-2 border-t border-[#F0F0F0] pt-3 text-[14px]">
                    {mine ? (
                        <PaidRow label="내 송금" target={mine} withTime />
                    ) : (
                        payment.targets.map((t, i) => (
                            <PaidRow
                                key={i}
                                label={
                                    <>
                                        {t.user.display_name}
                                        <span className="ml-2 font-semibold">{formatWon(t.amount)}</span>
                                    </>
                                }
                                target={t}
                            />
                        ))
                    )}
                </div>
            )}

            <div className="mt-3 flex items-center justify-between gap-2 border-t border-[#F0F0F0] pt-3">
                <span className={`min-w-0 break-all text-[14px] font-medium ${canceled ? 'text-[#646464]' : ''}`}>{account}</span>
                <button
                    type="button"
                    onClick={() => copyText(account).then(() => setCopied(true))}
                    className={`shrink-0 text-[13px] font-semibold ${canceled ? 'text-[#BBBBBB]' : 'text-ara_red'}`}
                >
                    {copied ? '복사됨' : '복사'}
                </button>
            </div>

            {canceled ? (
                <p className="mt-3 text-[12px] text-[#646464]">취소된 정산이라 송금할 수 없습니다</p>
            ) : mine ? (
                <div className="mt-4 flex items-center justify-end gap-3">
                    {isNative && (
                        <button
                            type="button"
                            onClick={() => setAppSheet(true)}
                            className="mr-auto break-keep text-left text-[12px] text-[#646464]"
                        >
                            {appNote ?? '송금 앱 열기'}
                        </button>
                    )}
                    {mine.paid_at ? (
                        <button
                            type="button"
                            disabled={payment.is_settled}
                            onClick={() => setDialog('unpaid')}
                            className="h-9 shrink-0 rounded-full bg-[#F6F6F6] px-4 text-[14px] font-medium text-[#646464]"
                        >
                            송금 완료됨
                        </button>
                    ) : (
                        <button
                            type="button"
                            data-press="strong"
                            onClick={() => setDialog('paid')}
                            className="h-9 shrink-0 rounded-full bg-ara_red px-4 text-[14px] font-semibold text-white"
                        >
                            송금 완료
                        </button>
                    )}
                </div>
            ) : (
                isHost && (
                    <div className="mt-4 flex items-center justify-end gap-3 text-[12px] text-[#646464]">
                        {canCancel && (
                            <button type="button" onClick={() => setDialog('cancel')}>
                                요청 취소
                            </button>
                        )}
                        <button type="button" onClick={() => setDialog('delete')} className="mr-auto">
                            요청 삭제
                        </button>
                        <span className="text-[13px]">
                            {paidCount}/{payment.targets.length} 송금 완료
                        </span>
                    </div>
                )
            )}

            {mine && (
                <BottomSheet open={appSheet} onClose={() => setAppSheet(false)} title="어떤 앱으로 보낼까요?">
                    <div className="divide-y divide-[#F0F0F0] px-5 pb-2">
                        {TRANSFER_APPS.map((app) => (
                            <MenuRow key={app.name} title={app.name} description={app.note} onClick={() => openApp(app, mine.amount)} />
                        ))}
                        <MenuRow title="계좌만 복사" description="다른 앱에 직접 붙여넣어요" onClick={() => openApp(null, mine.amount)} />
                    </div>
                </BottomSheet>
            )}

            <BottomSheet open={menuOpen} onClose={() => setMenuOpen(false)}>
                <div className="divide-y divide-[#F0F0F0] px-5">
                    {canCancel && (
                        <MenuRow
                            title="정산 취소"
                            description="카드는 채팅에 남고, 더 이상 송금받지 않습니다"
                            onClick={() => pick('cancel')}
                        />
                    )}
                    {canDelete && (
                        <MenuRow
                            title="삭제"
                            description="메시지가 채팅에서 사라집니다. 계좌를 가릴 때 씁니다"
                            onClick={() => pick('delete')}
                        />
                    )}
                </div>
            </BottomSheet>

            {dialog === 'paid' && (
                <ConfirmDialog
                    title={`${formatWon(amount)}을 보내셨나요?`}
                    onClose={closeDialog}
                    secondary={{ label: '아직이요', onClick: closeDialog }}
                    primary={{ label: '보냈어요', disabled: busy, onClick: () => run(() => setPaymentPaid(payment.id, true)) }}
                >
                    <Body>{payment.requester.display_name}에게 송금 완료로 표시됩니다.</Body>
                    <Rows rows={[['보낼 곳', account]]} />
                    {errorLine}
                </ConfirmDialog>
            )}
            {dialog === 'unpaid' && (
                <ConfirmDialog
                    title="송금 완료를 취소할까요?"
                    onClose={closeDialog}
                    secondary={{ label: '돌아가기', onClick: closeDialog }}
                    primary={{ label: '취소하기', disabled: busy, onClick: () => run(() => setPaymentPaid(payment.id, false)) }}
                >
                    {errorLine}
                </ConfirmDialog>
            )}
            {dialog === 'cancel' && (
                <ConfirmDialog
                    title="정산을 취소할까요?"
                    onClose={closeDialog}
                    secondary={{ label: '닫기', onClick: closeDialog }}
                    primary={{ label: '정산 취소하기', disabled: busy, onClick: () => run(() => cancelPaymentRequest(payment.id)) }}
                >
                    <Body>카드는 채팅에 남고, 더 이상 송금받지 않습니다.</Body>
                    <Rows
                        rows={[
                            ['청구', formatWon(payment.total_amount)],
                            ['송금 완료', `${payment.targets.length}명 중 ${paidCount}명`],
                        ]}
                    />
                    {errorLine}
                </ConfirmDialog>
            )}
            {dialog === 'delete' && (
                <ConfirmDialog
                    title="정산을 삭제할까요?"
                    onClose={closeDialog}
                    secondary={{ label: '닫기', onClick: closeDialog }}
                    primary={{
                        label: '삭제하기',
                        disabled: busy,
                        // deleteMessage already rethrows the server detail as the Error message.
                        onClick: () => run(() => deleteMessage(payment.message_id).then(() => null), (e) => (e as Error).message),
                    }}
                >
                    <Body>메시지가 채팅에서 사라집니다. 되돌릴 수 없습니다.</Body>
                    <Rows rows={[['계좌', account]]} />
                    {errorLine}
                </ConfirmDialog>
            )}
        </div>
    );
}

function PaidRow({ label, target, withTime = false }: { label: ReactNode; target: ChatPaymentTarget; withTime?: boolean }) {
    return (
        <div className="flex items-center justify-between gap-2">
            <span className="min-w-0 truncate text-[#646464]">{label}</span>
            {target.paid_at ? (
                <span className="shrink-0 font-semibold">송금 완료{withTime && ` ${target.paid_at.slice(11, 16)}`}</span>
            ) : (
                <span className="shrink-0 text-[#BBBBBB]">미송금</span>
            )}
        </div>
    );
}

function MenuRow({ title, description, onClick }: { title: string; description: string; onClick: () => void }) {
    return (
        <button type="button" onClick={onClick} className="block w-full py-4 text-left">
            <span className="block text-[16px] font-semibold text-black">{title}</span>
            <span className="mt-1 block text-[13px] text-[#646464]">{description}</span>
        </button>
    );
}
