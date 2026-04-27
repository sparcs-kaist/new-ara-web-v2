'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AppHeader, Screen } from '@/app/web_view/_components';
import { fetchMe, updateTos } from '@/lib/api/user';
import { tosContent } from '@/app/tos/content';

/**
 * Terms-of-service screen. Used both as a referenced doc (no acceptance UI)
 * and as a gating step right after SSO login (accept=true). The gating
 * variant adds a sticky red CTA at the bottom.
 */
export default function TermsPage() {
    const router = useRouter();
    const search = useSearchParams();
    const requireAccept = search?.get('accept') === 'true';
    const [meId, setMeId] = useState<number | null>(null);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!requireAccept) return;
        fetchMe()
            .then((data) => setMeId(data?.id ?? null))
            .catch((e) => console.warn('fetchMe failed', e));
    }, [requireAccept]);

    const onAccept = async () => {
        if (submitting) return;
        setSubmitting(true);
        try {
            if (meId != null) {
                await updateTos(meId);
            }
            router.replace('/web_view/Main');
        } catch (e) {
            console.warn('updateTos failed', e);
            if (typeof window !== 'undefined') {
                window.alert('동의 처리에 실패했어요. 잠시 후 다시 시도해 주세요.');
            }
        } finally {
            setSubmitting(false);
        }
    };

    const ko = tosContent.ko;

    return (
        <Screen withTabBar={false}>
            <AppHeader title="이용약관" />

            <div
                className="px-5"
                style={{ paddingBottom: requireAccept ? '96px' : '24px' }}
            >
                <p className="mt-0 text-[13px] text-[#B1B1B1]">{ko.lastUpdated}</p>

                {ko.tos.map((s, i) => (
                    <section key={i} className="mb-6">
                        <h2 className="m-0 mb-2 text-[15px] font-bold text-black">{s.title}</h2>
                        <p className="m-0 whitespace-pre-wrap text-[13px] leading-[1.7] text-[#646464]">
                            {s.content}
                        </p>
                    </section>
                ))}
            </div>

            {requireAccept && (
                <div
                    className="fixed inset-x-0 z-30 bg-white px-5 pt-3"
                    style={{
                        bottom: 0,
                        paddingBottom: 'calc(12px + var(--ara-safe-bottom))',
                    }}
                >
                    <button
                        type="button"
                        onClick={onAccept}
                        disabled={submitting}
                        className="block h-[50px] w-full rounded-[10px] bg-ara_red text-[15px] font-bold text-white disabled:bg-ara_red_bright"
                    >
                        {submitting ? '처리 중...' : '동의'}
                    </button>
                </div>
            )}
        </Screen>
    );
}
