'use client';

import { Screen } from '@/app/web_view/_components';

export default function ErrorPage() {
    const onRetry = () => {
        if (typeof window !== 'undefined') window.location.reload();
    };

    return (
        <Screen withTabBar={false}>
            <div
                style={{
                    minHeight: '100dvh',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 'var(--ara-spacing-xl)',
                    gap: 'var(--ara-spacing-lg)',
                    textAlign: 'center',
                }}
            >
                <h1 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>오류가 발생했어요.</h1>
                <button
                    type="button"
                    onClick={onRetry}
                    style={{
                        padding: '12px 24px',
                        borderRadius: 'var(--ara-radius-md)',
                        border: '1px solid var(--ara-divider-strong)',
                        background: 'var(--ara-bg)',
                        color: 'var(--ara-text-primary)',
                        fontSize: 14,
                        fontWeight: 600,
                        cursor: 'pointer',
                    }}
                >
                    다시 시도
                </button>
            </div>
        </Screen>
    );
}
