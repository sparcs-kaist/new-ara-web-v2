'use client';

import { useParams } from 'next/navigation';
import { useMajor } from '@/app/web_view/_query';
import { ScopedBoardScreen } from '../../_components/ScopedBoardScreen';

export default function MajorBoardPage() {
    const stdDeptId = Number(useParams<{ stdDeptId: string }>().stdDeptId);
    const { major, isPending } = useMajor(stdDeptId);

    return (
        <ScopedBoardScreen
            label="학과게시판"
            title={major?.major_name ?? null}
            lines={[]}
            pending={isPending}
            scope={{ stdDeptId }}
            canWrite={!!major?.is_mine}
            forbiddenMessage="설정한 학과의 게시판만 볼 수 있어요"
        />
    );
}
