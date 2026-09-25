'use client';

import { useState } from 'react';
import { BottomSheet, CheckIcon, RightChevronIcon } from '@/app/web_view/_components';
import {
    AccountFields,
    BankSheet,
    draftBankName,
    saveAccount,
    useSavedAccount,
    type AccountDraft,
} from '@/app/web_view/Delivery/_components/AccountFields';
import { AnonAvatar } from '@/app/web_view/Delivery/_components/AnonAvatar';
import { CtaButton } from '@/app/web_view/Delivery/_components/BottomCta';
import { NumberInput } from '@/app/web_view/Delivery/_components/fields';
import { createPaymentRequest } from '@/lib/api/chat';
import { apiDetail } from '@/lib/api/delivery';
import { formatWon } from '@/lib/delivery';
import type { ChatPaymentTargetRef } from '@/lib/types/chat';

export interface PaymentMember {
    name: string;
    target: ChatPaymentTargetRef;
}

type Step = 'targets' | 'amounts' | 'bank';

const keyOf = (t: ChatPaymentTargetRef) => ('user' in t ? `u${t.user}` : `a${t.anon_number}`);

export default function PaymentCreateSheet({
    open,
    roomId,
    members,
    onClose,
}: {
    open: boolean;
    roomId: number;
    members: PaymentMember[];
    onClose: () => void;
}) {
    const [prevOpen, setPrevOpen] = useState(false);
    const [step, setStep] = useState<Step>('targets');
    const [selected, setSelected] = useState<string[]>([]);
    const [split, setSplit] = useState(true);
    const [total, setTotal] = useState('');
    const [amounts, setAmounts] = useState<Record<string, string>>({});
    const [draft, setDraft] = useSavedAccount();
    const [editingAccount, setEditingAccount] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    if (open !== prevOpen) {
        setPrevOpen(open);
        if (open) {
            setStep('targets');
            setSelected([]);
            setSplit(true);
            setTotal('');
            setAmounts({});
            setEditingAccount(false);
            setError(null);
        }
    }

    const chosen = members.filter((m) => selected.includes(keyOf(m.target)));
    const share = chosen.length ? Math.ceil(Number(total) / chosen.length) : 0;
    const targets = chosen.map((m) => ({ ...m.target, amount: split ? share : Number(amounts[keyOf(m.target)] || 0) }));
    const bankName = draftBankName(draft);
    const accountNumber = draft.account.trim();
    const accountSet = bankName !== '' && accountNumber !== '';
    const valid = targets.length > 0 && targets.every((t) => t.amount >= 1) && accountSet;

    const toggle = (key: string) => setSelected((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
    const editAccount = (next: AccountDraft) => {
        setDraft(next);
        setEditingAccount(true);
    };

    const submit = async () => {
        if (!valid || submitting) return;
        setSubmitting(true);
        setError(null);
        const account = { bank_name: bankName, account_number: accountNumber };
        try {
            // The server broadcasts the new PAYMENT_REQUEST message, so nothing is added locally.
            await createPaymentRequest({ chat_room: roomId, ...account, targets });
            saveAccount(account);
            onClose();
        } catch (e) {
            setError(apiDetail(e));
        } finally {
            setSubmitting(false);
        }
    };

    const segment = (value: boolean, label: string) => (
        <button
            type="button"
            aria-pressed={split === value}
            onClick={() => setSplit(value)}
            className={`h-8 rounded-full border px-3 text-[14px] font-medium ${split === value ? 'border-ara_red bg-ara_red text-white' : 'border-[#F0F0F0] bg-white text-black'}`}
        >
            {label}
        </button>
    );

    return (
        <>
            <BottomSheet open={open && step === 'targets'} onClose={onClose} title="받을 사람">
                <ul className="border-t border-[#F0F0F0] px-5 pt-2">
                    {members.map((m) => {
                        const key = keyOf(m.target);
                        const on = selected.includes(key);
                        return (
                            <li key={key}>
                                <button
                                    type="button"
                                    aria-pressed={on}
                                    onClick={() => toggle(key)}
                                    className="flex h-[52px] w-full items-center gap-3 text-left"
                                >
                                    <AnonAvatar size={36} />
                                    <span className="min-w-0 flex-1 truncate text-[16px] text-black">{m.name}</span>
                                    <span
                                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${on ? 'bg-ara_red text-white' : 'border border-[#D9D9D9]'}`}
                                    >
                                        {on && <CheckIcon size={16} />}
                                    </span>
                                </button>
                            </li>
                        );
                    })}
                </ul>
                <div className="mx-5 mt-2 border-t border-[#F0F0F0] pt-4">
                    <p className="mb-3 text-[13px] font-semibold text-ara_red">{chosen.length}명 선택</p>
                    <CtaButton disabled={chosen.length === 0} onClick={() => setStep('amounts')}>
                        다음
                    </CtaButton>
                </div>
            </BottomSheet>

            <BottomSheet open={open && step === 'amounts'} onClose={onClose} title="금액 입력">
                <div className="space-y-4 border-t border-[#F0F0F0] px-5 pt-4">
                    <div className="flex gap-2">
                        {segment(true, '총액 나누기')}
                        {segment(false, '사람별 입력')}
                    </div>

                    {split ? (
                        <div>
                            <p className="mb-2 text-[14px] font-semibold text-black">총 금액</p>
                            <NumberInput value={total} onChange={setTotal} placeholder="0" unit="원" />
                            {share > 0 && (
                                <p className="mt-2 text-[12px] text-[#646464]">
                                    {chosen.length}명에게 {formatWon(share)}씩 청구됩니다
                                </p>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {chosen.map((m) => {
                                const key = keyOf(m.target);
                                return (
                                    <div key={key} className="flex items-center gap-3">
                                        <span className="w-16 shrink-0 truncate text-[15px] text-black">{m.name}</span>
                                        <div className="min-w-0 flex-1">
                                            <NumberInput
                                                value={amounts[key] ?? ''}
                                                onChange={(v) => setAmounts((prev) => ({ ...prev, [key]: v }))}
                                                placeholder="0"
                                                unit="원"
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    <div className="border-t border-[#F0F0F0] pt-4">
                        <p className="mb-2 text-[14px] font-semibold text-black">받을 계좌</p>
                        {accountSet && !editingAccount ? (
                            <button
                                type="button"
                                onClick={() => setEditingAccount(true)}
                                className="flex h-12 w-full items-center justify-between gap-2 rounded-[10px] bg-[#F6F6F6] px-4 text-[15px] text-black"
                            >
                                <span className="truncate">
                                    {bankName} {accountNumber}
                                </span>
                                <RightChevronIcon size={20} className="shrink-0 text-[#646464]" />
                            </button>
                        ) : (
                            <AccountFields draft={draft} onChange={editAccount} onPickBank={() => setStep('bank')} />
                        )}
                    </div>

                    {error && <p className="text-[13px] text-ara_red">{error}</p>}
                    <CtaButton disabled={!valid || submitting} onClick={submit}>
                        정산 요청 보내기
                    </CtaButton>
                </div>
            </BottomSheet>

            <BankSheet
                open={open && step === 'bank'}
                selected={draft.bankChoice}
                onSelect={(bank) => {
                    editAccount({ ...draft, bankChoice: bank });
                    setStep('amounts');
                }}
                onClose={() => setStep('amounts')}
            />
        </>
    );
}
