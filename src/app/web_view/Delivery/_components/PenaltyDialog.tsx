'use client';

import { ConfirmDialog } from '@/app/web_view/_components';
import { Body } from './DeliveryActionDialog';

export function PenaltyDialog({ message, onConfirm }: { message: string; onConfirm: () => void }) {
    return (
        <ConfirmDialog title="지금은 방을 만들 수 없어요" primary={{ label: '확인', onClick: onConfirm }} onClose={onConfirm}>
            <Body>{message}</Body>
        </ConfirmDialog>
    );
}
