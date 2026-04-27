'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Screen, AppHeader } from '@/app/web_view/_components';
import { fetchMe, updateTos } from '@/lib/api/user';
import { tosContent } from '@/app/tos/content';

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
            alert('동의 처리에 실패했어요. 잠시 후 다시 시도해 주세요.');
        } finally {
            setSubmitting(false);
        }
    };

    const ko = tosContent.ko;

    return (
        <Screen withTabBar={false}>
            <AppHeader title="이용약관" />

            <div
                style={{
                    padding: 'var(--ara-spacing-lg)',
                    paddingBottom: requireAccept ? 96 : 'var(--ara-spacing-xl)',
                }}
            >
                <p style={{ fontSize: 13, color: 'var(--ara-text-secondary)', marginTop: 0 }}>
                    {ko.lastUpdated}
                </p>

                {ko.tos.map((s, i) => (
                    <section key={i} style={{ marginBottom: 'var(--ara-spacing-xl)' }}>
                        <h2
                            style={{
                                fontSize: 15,
                                fontWeight: 700,
                                color: 'var(--ara-text-primary)',
                                margin: '0 0 8px',
                            }}
                        >
                            {s.title}
                        </h2>
                        <p
                            style={{
                                fontSize: 13,
                                lineHeight: 1.7,
                                color: 'var(--ara-text-secondary)',
                                margin: 0,
                                whiteSpace: 'pre-wrap',
                            }}
                        >
                            {s.content}
                        </p>
                    </section>
                ))}
            </div>

            {requireAccept && (
                <div
                    style={{
                        position: 'fixed',
                        left: 0,
                        right: 0,
                        bottom: 'var(--ara-safe-bottom)',
                        padding: 'var(--ara-spacing-lg)',
                        background: 'var(--ara-bg)',
                        borderTop: '1px solid var(--ara-divider)',
                    }}
                >
                    <button
                        type="button"
                        onClick={onAccept}
                        disabled={submitting}
                        style={{
                            width: '100%',
                            padding: '14px',
                            borderRadius: 'var(--ara-radius-md)',
                            border: 0,
                            background: 'var(--ara-primary)',
                            color: 'var(--ara-text-on-primary)',
                            fontSize: 15,
                            fontWeight: 700,
                            cursor: submitting ? 'default' : 'pointer',
                        }}
                    >
                        {submitting ? '처리 중...' : '동의'}
                    </button>
                </div>
            )}
        </Screen>
    );
}
