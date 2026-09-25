'use client';

import { useEffect, useState } from 'react';
import { BottomSheet, CheckIcon, RightChevronIcon } from '@/app/web_view/_components';
import { INPUT_CLASS } from './fields';

const BANKS = ['토스뱅크', '카카오뱅크', '국민은행', '신한은행', '우리은행', '하나은행', '농협은행', '기업은행', '새마을금고', '케이뱅크'];
const CUSTOM_BANK = '직접 입력';
const ACCOUNT_KEY = 'ara:settle-account';

export interface AccountDraft {
    bankChoice: string;
    customBank: string;
    account: string;
}

export const draftBankName = (d: AccountDraft) => (d.bankChoice === CUSTOM_BANK ? d.customBank : d.bankChoice).trim();

/** Starts from the last account this device sent a settlement to. */
export function useSavedAccount() {
    const [draft, setDraft] = useState<AccountDraft>({ bankChoice: '', customBank: '', account: '' });

    useEffect(() => {
        try {
            const saved = JSON.parse(localStorage.getItem(ACCOUNT_KEY) ?? 'null');
            if (!saved?.bank_name) return;
            const known = BANKS.includes(saved.bank_name);
            setDraft({
                bankChoice: known ? saved.bank_name : CUSTOM_BANK,
                customBank: known ? '' : saved.bank_name,
                account: saved.account_number ?? '',
            });
        } catch { /* blocked storage */ }
    }, []);

    return [draft, setDraft] as const;
}

export function saveAccount(info: { bank_name: string; account_number: string }) {
    try { localStorage.setItem(ACCOUNT_KEY, JSON.stringify(info)); } catch { /* blocked storage */ }
}

export function AccountFields({
    draft,
    onChange,
    onPickBank,
}: {
    draft: AccountDraft;
    onChange: (draft: AccountDraft) => void;
    onPickBank: () => void;
}) {
    return (
        <div className="space-y-2">
            <button
                type="button"
                onClick={onPickBank}
                className="flex h-12 w-full items-center justify-between rounded-[10px] bg-[#F6F6F6] px-4 text-[15px]"
            >
                <span className={draft.bankChoice ? 'text-black' : 'text-[#BBBBBB]'}>{draft.bankChoice || '은행 선택'}</span>
                <RightChevronIcon size={20} className="text-[#646464]" />
            </button>
            {draft.bankChoice === CUSTOM_BANK && (
                <input
                    value={draft.customBank}
                    onChange={(e) => onChange({ ...draft, customBank: e.target.value })}
                    placeholder="은행 이름"
                    maxLength={30}
                    className={INPUT_CLASS}
                />
            )}
            <input
                value={draft.account}
                onChange={(e) => onChange({ ...draft, account: e.target.value.replace(/[^\d-]/g, '') })}
                placeholder="계좌번호"
                inputMode="numeric"
                maxLength={30}
                className={INPUT_CLASS}
            />
        </div>
    );
}

export function BankSheet({
    open,
    selected,
    onSelect,
    onClose,
}: {
    open: boolean;
    selected: string;
    onSelect: (bank: string) => void;
    onClose: () => void;
}) {
    return (
        <BottomSheet open={open} onClose={onClose} title="은행 선택">
            <ul>
                {[...BANKS, CUSTOM_BANK].map((bank) => (
                    <li key={bank}>
                        <button
                            type="button"
                            onClick={() => onSelect(bank)}
                            className="flex h-[46px] w-full items-center justify-between px-5 text-left text-[15px] text-black"
                        >
                            <span className={bank === selected ? 'font-semibold' : undefined}>{bank}</span>
                            {bank === selected && <CheckIcon size={20} className="text-ara_red" />}
                        </button>
                    </li>
                ))}
            </ul>
        </BottomSheet>
    );
}
