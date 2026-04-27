'use client';

import { Screen, AppHeader } from '@/app/web_view/_components';
import { bridge } from '@/app/web_view/_bridge';

export default function InquiryPage() {
    const onMail = () => {
        bridge?.send('openExternal', { url: 'mailto:new-ara@sparcs.org' });
    };

    return (
        <Screen withTabBar={false}>
            <AppHeader title="문의" showBack={false} />

            <div
                style={{
                    minHeight: 'calc(100dvh - var(--ara-header-height) - var(--ara-safe-top) - var(--ara-safe-bottom))',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 'var(--ara-spacing-xl)',
                    gap: 'var(--ara-spacing-xl)',
                    textAlign: 'center',
                }}
            >
                <p
                    style={{
                        fontSize: 14,
                        lineHeight: 1.7,
                        color: 'var(--ara-text-secondary)',
                        margin: 0,
                        maxWidth: 320,
                    }}
                >
                    탈퇴된 계정입니다. 자세한 내용은
                    <br />
                    new-ara@sparcs.org 로 문의해 주세요.
                </p>

                <button
                    type="button"
                    onClick={onMail}
                    style={{
                        padding: '12px 24px',
                        borderRadius: 'var(--ara-radius-md)',
                        border: 0,
                        background: 'var(--ara-primary)',
                        color: 'var(--ara-text-on-primary)',
                        fontSize: 14,
                        fontWeight: 700,
                        cursor: 'pointer',
                    }}
                >
                    메일 보내기
                </button>
            </div>
        </Screen>
    );
}
