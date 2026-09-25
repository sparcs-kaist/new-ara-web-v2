'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import {
    AppHeader,
    BottomSheet,
    CenteredSpinner,
    ConfirmDialog,
    RightChevronIcon,
    Screen,
} from '@/app/web_view/_components';
import { CheckIcon } from '@/app/web_view/PostWrite/components/icons';
import { DELIVERY_KEY, useDeliveryParty } from '@/app/web_view/_query';
import { useSafeBack } from '@/app/web_view/hooks/useSafeBack';
import { apiDetail, requestDeliveryPayment } from '@/lib/api/delivery';
import { CtaButton, FixedBottomBar } from '../../_components/BottomCta';
import { Body } from '../../_components/DeliveryActionDialog';
import { INPUT_CLASS, NumberInput } from '../../_components/fields';
import { SettlementTable } from '../../_components/SettlementTable';

const BANKS = ['토스뱅크', '카카오뱅크', '국민은행', '신한은행', '우리은행', '하나은행', '농협은행', '기업은행', '새마을금고', '케이뱅크'];
const CUSTOM_BANK = '직접 입력';
const ACCOUNT_KEY = 'ara:settle-account';

/** Host's 정산 요청 page: account, delivery fee and the per-orderer preview, then the payment request. */
export default function SettlementPage() {
    const id = Number(useParams<{ id: string }>().id);
    const back = useSafeBack();
    const qc = useQueryClient();
    const { data: party } = useDeliveryParty(id || null);
    const [bankChoice, setBankChoice] = useState('');
    const [customBank, setCustomBank] = useState('');
    const [account, setAccount] = useState('');
    const [fee, setFee] = useState('');
    const [picking, setPicking] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        try {
            const saved = JSON.parse(localStorage.getItem(ACCOUNT_KEY) ?? 'null');
            if (!saved?.bank_name) return;
            const known = BANKS.includes(saved.bank_name);
            setBankChoice(known ? saved.bank_name : CUSTOM_BANK);
            if (!known) setCustomBank(saved.bank_name);
            setAccount(saved.account_number ?? '');
        } catch { /* blocked storage */ }
    }, []);

    const bankName = (bankChoice === CUSTOM_BANK ? customBank : bankChoice).trim();
    const valid = !!party && bankName !== '' && account.trim() !== '';

    const submit = async () => {
        if (!party || !valid || submitting) return;
        setSubmitting(true);
        setError(null);
        const accountInfo = { bank_name: bankName, account_number: account.trim() };
        try {
            await requestDeliveryPayment(party.id, { ...accountInfo, delivery_fee: Number(fee) || 0 });
            try { localStorage.setItem(ACCOUNT_KEY, JSON.stringify(accountInfo)); } catch { /* blocked storage */ }
            qc.invalidateQueries({ queryKey: DELIVERY_KEY });
            back();
        } catch (e) {
            setError(apiDetail(e));
            setSubmitting(false);
        }
    };

    return (
        <Screen withTabBar={false}>
            <AppHeader title="정산 요청" />

            {party ? (
                <div className="space-y-6 px-5 pb-[96px] pt-2">
                    <section>
                        <h2 className="mb-2 text-[15px] font-semibold text-black">입금 받을 계좌</h2>
                        <div className="space-y-2">
                            <button
                                type="button"
                                onClick={() => setPicking(true)}
                                className="flex h-12 w-full items-center justify-between rounded-[10px] bg-[#F6F6F6] px-4 text-[15px]"
                            >
                                <span className={bankChoice ? 'text-black' : 'text-[#BBBBBB]'}>{bankChoice || '은행 선택'}</span>
                                <RightChevronIcon size={20} className="text-[#646464]" />
                            </button>
                            {bankChoice === CUSTOM_BANK && (
                                <input
                                    value={customBank}
                                    onChange={(e) => setCustomBank(e.target.value)}
                                    placeholder="은행 이름"
                                    maxLength={30}
                                    className={INPUT_CLASS}
                                />
                            )}
                            <input
                                value={account}
                                onChange={(e) => setAccount(e.target.value.replace(/[^\d-]/g, ''))}
                                placeholder="계좌번호"
                                inputMode="numeric"
                                maxLength={30}
                                className={INPUT_CLASS}
                            />
                        </div>
                    </section>

                    <section>
                        <h2 className="mb-2 text-[15px] font-semibold text-black">배송비</h2>
                        <NumberInput value={fee} onChange={setFee} placeholder="0" unit="원" />
                    </section>

                    <SettlementTable orders={party.orders ?? []} fee={Number(fee) || 0} />
                </div>
            ) : (
                <CenteredSpinner />
            )}

            <FixedBottomBar>
                {error && <p className="mb-2 text-[13px] text-ara_red">{error}</p>}
                <CtaButton disabled={!valid || submitting} onClick={submit}>
                    정산 요청 보내기
                </CtaButton>
            </FixedBottomBar>

            <BankSheet
                open={picking}
                selected={bankChoice}
                onSelect={(bank) => {
                    setBankChoice(bank);
                    setPicking(false);
                }}
                onClose={() => setPicking(false)}
            />

            {/* `submitting` stays set after a send, so the refetched party does not flash this on the way back. */}
            {party && party.payment_request !== null && !submitting && (
                <ConfirmDialog title="이미 보낸 정산 요청이 있어요" primary={{ label: '확인', onClick: back }} onClose={back}>
                    <Body>금액을 고치려면 채팅의 정산 메시지를 삭제한 뒤 다시 요청하세요.</Body>
                </ConfirmDialog>
            )}
        </Screen>
    );
}

function BankSheet({
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
