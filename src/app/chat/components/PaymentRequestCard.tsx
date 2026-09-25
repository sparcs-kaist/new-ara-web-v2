'use client';

import { useEffect, useState } from 'react';
import { ConfirmDialog } from '@/app/web_view/_components/ConfirmDialog';
import { getBridge, useIsNative } from '@/app/web_view/_bridge';
import { Body, Rows } from '@/app/web_view/Delivery/_components/DeliveryActionDialog';
import { INPUT_CLASS } from '@/app/web_view/Delivery/_components/fields';
import { deleteMessage, setPaymentPaid, updatePaymentAccount } from '@/lib/api/chat';
import { apiDetail } from '@/lib/api/delivery';
import { formatWon, orderTotal } from '@/lib/delivery';
import type { ChatPaymentRequest } from '@/lib/types/chat';
import type { DeliveryParty } from '@/lib/types/delivery';
import { copyText } from './MessageContextMenu';

// Best effort: the shell rejects schemes it cannot open, and a failed open stays silent.
const BANK_APP_URLS: Record<string, string> = {
    토스뱅크: 'supertoss://',
    카카오뱅크: 'kakaobank://',
    국민은행: 'kbbank://',
    신한은행: 'shinhan-sr-ssb://',
    우리은행: 'newsmartpib://',
    농협은행: 'nhsmartbanking://',
};

type Dialog = 'paid' | 'unpaid' | 'delete';

interface PaymentRequestCardProps {
    payment: ChatPaymentRequest;
    party?: DeliveryParty;
    isHost: boolean;
    /** The request after a change, or null once it was deleted. */
    onChanged: (next: ChatPaymentRequest | null) => void;
}

/** PAYMENT_REQUEST message: what I owe (or, for the requester, what is collected) and the 송금 완료 flow. */
export default function PaymentRequestCard({ payment, party, isHost, onChanged }: PaymentRequestCardProps) {
    const isNative = useIsNative();
    const [dialog, setDialog] = useState<Dialog | null>(null);
    const [editing, setEditing] = useState(false);
    const [copied, setCopied] = useState(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!copied) return;
        const t = window.setTimeout(() => setCopied(false), 1500);
        return () => window.clearTimeout(t);
    }, [copied]);

    const mine = payment.targets.find((t) => t.user.is_mine);
    const amount = mine ? mine.amount : payment.total_amount;
    const myOrders = party?.orders?.filter((o) => o.orderer.is_mine);
    const subtotal = myOrders && orderTotal(myOrders);
    const paidCount = payment.targets.filter((t) => t.paid_at).length;
    const account = `${payment.bank_name} ${payment.account_number}`;
    const bankAppUrl = isNative ? BANK_APP_URLS[payment.bank_name] : undefined;

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

    return (
        <div className="w-[260px] rounded-[15px] border border-[#F0F0F0] bg-white p-4 text-left text-black">
            <p className="text-[12px] font-semibold text-ara_red">{payment.is_settled ? '정산 완료' : '정산 요청'}</p>
            <p className="mt-2 text-[22px] font-bold leading-7">{formatWon(amount)}</p>
            {mine && subtotal !== undefined && (
                <p className="mt-1 text-[12px] text-[#646464]">
                    주문 {formatWon(subtotal)} + 배송비 {formatWon(mine.amount - subtotal)}
                </p>
            )}

            <div className="mt-3 border-t border-[#F0F0F0] pt-3">
                {editing ? (
                    <AccountForm
                        payment={payment}
                        onCancel={() => setEditing(false)}
                        onSaved={(next) => {
                            setEditing(false);
                            onChanged(next);
                        }}
                    />
                ) : (
                    <div className="flex items-center justify-between gap-2">
                        <span className="min-w-0 break-all text-[14px] font-medium">{account}</span>
                        <button
                            type="button"
                            onClick={() => copyText(account).then(() => setCopied(true))}
                            className="shrink-0 text-[13px] font-semibold text-ara_red"
                        >
                            {copied ? '복사됨' : '복사'}
                        </button>
                    </div>
                )}
            </div>

            {mine ? (
                <div className="mt-4 flex items-center justify-end gap-3">
                    {bankAppUrl && (
                        <button
                            type="button"
                            onClick={() => getBridge().send('openExternal', { url: bankAppUrl })}
                            className="mr-auto text-[12px] text-[#646464]"
                        >
                            은행 앱 열기
                        </button>
                    )}
                    {mine.paid_at ? (
                        <button
                            type="button"
                            disabled={payment.is_settled}
                            onClick={() => setDialog('unpaid')}
                            className="h-9 rounded-full bg-[#F6F6F6] px-4 text-[14px] font-medium text-[#646464]"
                        >
                            송금 완료됨
                        </button>
                    ) : (
                        <button
                            type="button"
                            data-press="strong"
                            onClick={() => setDialog('paid')}
                            className="h-9 rounded-full bg-ara_red px-4 text-[14px] font-semibold text-white"
                        >
                            송금 완료
                        </button>
                    )}
                </div>
            ) : (
                isHost && (
                    <div className="mt-4 flex items-center justify-end gap-3 text-[12px] text-[#646464]">
                        {paidCount === 0 && !editing && (
                            <>
                                <button type="button" onClick={() => setEditing(true)}>
                                    계좌 수정
                                </button>
                                <button type="button" onClick={() => setDialog('delete')} className="mr-auto">
                                    요청 삭제
                                </button>
                            </>
                        )}
                        <span className="text-[13px]">
                            {paidCount}/{payment.targets.length} 송금 완료
                        </span>
                    </div>
                )
            )}

            {dialog === 'paid' && (
                <ConfirmDialog
                    title={`${formatWon(amount)}을 보내셨나요?`}
                    onClose={closeDialog}
                    secondary={{ label: '아직이요', onClick: closeDialog }}
                    primary={{ label: '보냈어요', disabled: busy, onClick: () => run(() => setPaymentPaid(payment.id, true)) }}
                >
                    <Body>방장에게 송금 완료로 표시됩니다.</Body>
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
            {dialog === 'delete' && (
                <ConfirmDialog
                    title="정산 요청을 삭제할까요?"
                    onClose={closeDialog}
                    secondary={{ label: '돌아가기', onClick: closeDialog }}
                    primary={{
                        label: '삭제하기',
                        disabled: busy,
                        // deleteMessage already rethrows the server detail as the Error message.
                        onClick: () => run(() => deleteMessage(payment.message_id).then(() => null), (e) => (e as Error).message),
                    }}
                >
                    <Body>삭제한 뒤 금액을 고쳐 다시 요청할 수 있어요.</Body>
                    {errorLine}
                </ConfirmDialog>
            )}
        </div>
    );
}

/** The requester's inline bank/account fix, allowed until someone has paid. */
function AccountForm({
    payment,
    onCancel,
    onSaved,
}: {
    payment: ChatPaymentRequest;
    onCancel: () => void;
    onSaved: (next: ChatPaymentRequest) => void;
}) {
    const [bank, setBank] = useState(payment.bank_name);
    const [account, setAccount] = useState(payment.account_number);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const valid = bank.trim() !== '' && account.trim() !== '';

    const save = async () => {
        setSaving(true);
        setError(null);
        try {
            onSaved(await updatePaymentAccount(payment.id, { bank_name: bank.trim(), account_number: account.trim() }));
        } catch (e) {
            setError(apiDetail(e));
            setSaving(false);
        }
    };

    return (
        <div className="space-y-2">
            <input value={bank} onChange={(e) => setBank(e.target.value)} placeholder="은행" maxLength={30} className={INPUT_CLASS} />
            <input
                value={account}
                onChange={(e) => setAccount(e.target.value.replace(/[^\d-]/g, ''))}
                placeholder="계좌번호"
                inputMode="numeric"
                maxLength={30}
                className={INPUT_CLASS}
            />
            {error && <p className="text-[13px] text-ara_red">{error}</p>}
            <div className="flex gap-2">
                <button
                    type="button"
                    onClick={onCancel}
                    className="h-10 flex-1 rounded-[10px] bg-[#F6F6F6] text-[14px] font-medium text-[#646464]"
                >
                    취소
                </button>
                <button
                    type="button"
                    data-press="strong"
                    disabled={!valid || saving}
                    onClick={save}
                    className="h-10 flex-1 rounded-[10px] bg-ara_red text-[14px] font-medium text-white disabled:bg-[#F0F0F0] disabled:text-[#BBBBBB]"
                >
                    저장
                </button>
            </div>
        </div>
    );
}
