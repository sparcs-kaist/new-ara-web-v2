'use client';

import { useEffect, useRef } from 'react';
import { AppHeader, Screen } from '@/app/web_view/_components';
import { useDeliveryPenalty } from '@/app/web_view/_query';
import { useNow } from '@/app/web_view/hooks/useNow';
import { useSafeBack } from '@/app/web_view/hooks/useSafeBack';
import type { DeliveryPenalty } from '@/lib/types/delivery';
import { CtaButton, FixedBottomBar } from '../_components/BottomCta';

const REASONS: Record<NonNullable<DeliveryPenalty['reason']>, string> = {
    HOST: '다른 사람이 주문을 넣은 뒤 모집을 취소했습니다.',
    NO_DECISION: '최소 주문 금액을 채웠는데 주문을 확정하지 않아 자동 취소됐습니다.',
};

const RULES: [situation: string, penalized: boolean][] = [
    ['다른 사람 주문이 없을 때 취소', false],
    ['최소 금액 미달로 취소', false],
    ['다른 사람 주문 후 방장이 취소', true],
    ['금액을 채웠는데 주문하지 않음', true],
];

function formatLeft(ms: number): string {
    const minutes = Math.ceil(ms / 60_000);
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return h > 0 ? `${h}시간${m ? ` ${m}분` : ''}` : `${m}분`;
}

export default function DeliveryRestrictedPage() {
    const back = useSafeBack();
    const now = useNow();
    const { data, isFetching } = useDeliveryPenalty();
    const left = data?.until ? new Date(data.until).getTime() - now : 0;
    const reason = data?.reason;

    // A ref survives Strict Mode's effect replay; a second back() would leave the list.
    const leftPage = useRef(false);
    useEffect(() => {
        // Wait out a refetch: after a 403 from create the cache may still say "no penalty".
        if (data && !isFetching && left <= 0 && !leftPage.current) {
            leftPage.current = true;
            back();
        }
    }, [data, isFetching, left, back]);

    return (
        <Screen withTabBar={false}>
            <AppHeader title="방 개설 제한" />

            <div className="px-5 pb-[96px] pt-6">
                <div className="rounded-[14px] bg-ara_red_most_bright px-4 pb-[15px] pt-6">
                    <p className="min-h-[29px] text-[20px] font-bold leading-[29px] text-ara_red">
                        {left > 0 && `${formatLeft(left)} 남았습니다`}
                    </p>
                    <p className="mt-[5px] text-[13px] leading-[19px] text-[#555555]">제한이 풀리면 다시 방을 만들 수 있습니다.</p>
                </div>
                {data?.duration_hours === 24 && <p className="mt-3 text-[13px] font-medium text-ara_red">이번 제한은 하루예요.</p>}

                <div className="mb-8 mt-10 h-px bg-[#F0F0F0]" />

                {reason && (
                    <section className="mb-12">
                        <h2 className="text-[13px] font-bold text-[#222222]">제한 사유</h2>
                        <p className="mt-2 break-keep text-[14px] leading-5 text-[#333333]">{REASONS[reason]}</p>
                    </section>
                )}

                <section>
                    <h2 className="text-[13px] font-bold text-[#222222]">패널티 기준</h2>
                    <dl className="mt-[13px] space-y-7">
                        {RULES.map(([situation, penalized]) => (
                            <div key={situation} className="flex items-center justify-between gap-4 text-[14px] leading-5">
                                <dt className="text-[#333333]">{situation}</dt>
                                <dd className={`shrink-0 font-bold ${penalized ? 'text-ara_red' : 'text-[#888888]'}`}>
                                    {penalized ? '있음' : '없음'}
                                </dd>
                            </div>
                        ))}
                    </dl>
                    <p className="mt-7 text-[12px] text-[#888888]">처음에는 3시간, 반복하면 하루 동안 제한됩니다.</p>
                </section>
            </div>

            <FixedBottomBar>
                <CtaButton onClick={back}>다른 방 둘러보기</CtaButton>
            </FixedBottomBar>
        </Screen>
    );
}
