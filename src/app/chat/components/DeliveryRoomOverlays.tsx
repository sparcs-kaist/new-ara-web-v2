'use client';

import { ConfirmDialog } from '@/app/web_view/_components/ConfirmDialog';
import { ReportSheet } from '@/app/web_view/_components/ReportSheet';
import { Body, DeliveryActionDialog } from '@/app/web_view/Delivery/_components/DeliveryActionDialog';
import { MembersSheet } from '@/app/web_view/Delivery/_components/MembersSheet';
import { OrderSheet } from '@/app/web_view/Delivery/_components/OrderSheet';
import { RoomInfoSheet } from '@/app/web_view/Delivery/_components/RoomInfoSheet';
import type { DeliveryMember } from '@/lib/types/delivery';
import type { useDeliveryRoom } from '../hooks/useDeliveryRoom';
import PaymentCreateSheet from './PaymentCreateSheet';
import VoteCreateSheet from './VoteCreateSheet';

interface DeliveryRoomOverlaysProps {
    delivery: ReturnType<typeof useDeliveryRoom>;
    roomId: number;
    deleteError: string | null;
    setDeleteError: (error: string | null) => void;
    onLeft: () => void;
}

export default function DeliveryRoomOverlays({ delivery, roomId, deleteError, setDeleteError, onLeft }: DeliveryRoomOverlaysProps) {
    const {
        party, sheet, setSheet, action, setAction, startAction, openSettlement, openPaymentSheet,
        voteOpen, setVoteOpen, paymentOpen, setPaymentOpen, paymentMembers, rerequestBlocked, setRerequestBlocked,
        report, openReport, closeReport,
    } = delivery;
    const reportMember = (m: DeliveryMember) =>
        openReport({ target: { kind: 'chat_member', roomId, anonNumber: m.anon_number }, label: m.display_name });
    return (
        <>
            {party && (
                <>
                    <OrderSheet
                        open={sheet?.kind === 'order'}
                        party={party}
                        order={sheet?.kind === 'order' ? sheet.order : undefined}
                        onClose={() => setSheet(null)}
                    />
                    <RoomInfoSheet
                        open={sheet?.kind === 'info'}
                        party={party}
                        onAction={startAction}
                        onSettle={openSettlement}
                        onReport={reportMember}
                        onClose={() => setSheet(null)}
                    />
                    <MembersSheet
                        open={sheet?.kind === 'members'}
                        party={party}
                        onKick={(member) => startAction({ kind: 'kick', member })}
                        onReport={reportMember}
                        onClose={() => setSheet(null)}
                    />
                    {action && (
                        <DeliveryActionDialog
                            key={action.kind}
                            party={party}
                            action={action}
                            onAction={setAction}
                            onClose={() => setAction(null)}
                            onLeft={onLeft}
                        />
                    )}
                </>
            )}

            <VoteCreateSheet open={voteOpen} roomId={roomId} onClose={() => setVoteOpen(false)} />
            <PaymentCreateSheet open={paymentOpen} roomId={roomId} members={paymentMembers} onClose={() => setPaymentOpen(false)} />
            <ReportSheet subject={report} onClose={closeReport} />

            {deleteError && (
                <ConfirmDialog
                    title={deleteError}
                    primary={{ label: '확인', onClick: () => setDeleteError(null) }}
                    onClose={() => setDeleteError(null)}
                />
            )}
            {rerequestBlocked && party && (
                <ConfirmDialog
                    title={party.payment_request !== null ? '이미 정산을 요청했어요' : '배달 정산을 다시 보낼 수 없어요'}
                    secondary={{ label: '닫기', onClick: () => setRerequestBlocked(false) }}
                    primary={{
                        label: '정산 보내기',
                        onClick: () => {
                            setRerequestBlocked(false);
                            openPaymentSheet();
                        },
                    }}
                    onClose={() => setRerequestBlocked(false)}
                >
                    <Body>
                        {party.payment_request !== null
                            ? '잘못 보냈다면 정산을 취소하고 다시 보내주세요.'
                            : '송금한 사람이 있어요. 필요한 사람에게 정산을 보내주세요.'}
                    </Body>
                </ConfirmDialog>
            )}
        </>
    );
}
