'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { AppHeader, CenteredSpinner, ConfirmDialog, Screen } from '@/app/web_view/_components';
import { DELIVERY_KEY, useDeliveryParty } from '@/app/web_view/_query';
import { useSafeBack } from '@/app/web_view/hooks/useSafeBack';
import { apiDetail, requestDeliveryPayment } from '@/lib/api/delivery';
import { AccountFields, BankSheet, draftBankName, saveAccount, useSavedAccount } from '../../_components/AccountFields';
import { CtaButton, FixedBottomBar } from '../../_components/BottomCta';
import { Body } from '../../_components/DeliveryActionDialog';
import { NumberInput } from '../../_components/fields';
import { SettlementTable } from '../../_components/SettlementTable';

export default function SettlementPage() {
    const id = Number(useParams<{ id: string }>().id);
    const back = useSafeBack();
    const qc = useQueryClient();
    const { data: party, error: loadError } = useDeliveryParty(id || null);
    const [draft, setDraft] = useSavedAccount();
    const [fee, setFee] = useState('');
    const [picking, setPicking] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const errorRef = useRef<HTMLParagraphElement>(null);

    // 'center', not 'nearest': 'nearest' parks the line under the fixed bottom bar.
    useEffect(() => {
        if (error) errorRef.current?.scrollIntoView({ block: 'center' });
    }, [error]);

    const bankName = draftBankName(draft);
    const valid = !!party && bankName !== '' && draft.account.trim() !== '';

    const submit = async () => {
        if (!party || !valid || submitting) return;
        setSubmitting(true);
        setError(null);
        const accountInfo = { bank_name: bankName, account_number: draft.account.trim() };
        try {
            await requestDeliveryPayment(party.id, { ...accountInfo, delivery_fee: Number(fee) || 0 });
            saveAccount(accountInfo);
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
                        <AccountFields draft={draft} onChange={setDraft} onPickBank={() => setPicking(true)} />
                    </section>

                    <section>
                        <h2 className="mb-2 text-[15px] font-semibold text-black">배송비</h2>
                        <NumberInput value={fee} onChange={setFee} placeholder="0" unit="원" />
                    </section>

                    <SettlementTable orders={party.orders ?? []} fee={Number(fee) || 0} />
                    {error && <p ref={errorRef} className="text-[13px] text-ara_red">{error}</p>}
                </div>
            ) : loadError ? (
                <p className="px-5 py-10 text-center text-[14px] text-[#BBBBBB]">{apiDetail(loadError)}</p>
            ) : (
                <CenteredSpinner />
            )}

            <FixedBottomBar>
                <CtaButton disabled={!valid || submitting} onClick={submit}>
                    정산 요청 보내기
                </CtaButton>
            </FixedBottomBar>

            <BankSheet
                open={picking}
                selected={draft.bankChoice}
                onSelect={(bank) => {
                    setDraft({ ...draft, bankChoice: bank });
                    setPicking(false);
                }}
                onClose={() => setPicking(false)}
            />

            {/* `submitting` stays set after a send, so the refetched party does not flash these on the way back. */}
            {party && !party.can_request_payment && !submitting && (
                <ConfirmDialog
                    title={party.payment_request !== null ? '이미 정산을 요청했어요' : '배달 정산을 다시 보낼 수 없어요'}
                    primary={{ label: '확인', onClick: back }}
                    onClose={back}
                >
                    <Body>
                        {party.payment_request !== null
                            ? '잘못 보냈다면 정산을 취소하고 다시 보내주세요.'
                            : '필요한 사람에게 정산을 보내주세요.'}
                    </Body>
                </ConfirmDialog>
            )}
        </Screen>
    );
}
