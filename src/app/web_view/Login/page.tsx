'use client';

import { Screen } from '@/app/web_view/_components';

export default function LoginPage() {
    const onSsoLogin = () => {
        const apiHost = process.env.NEXT_PUBLIC_API_HOST || 'https://newara.dev.sparcs.org';
        const next = encodeURIComponent('https://newara.dev.sparcs.org/web_view/Main');
        window.location.href = `${apiHost}/api/users/sso_login/?next=${next}`;
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
                    gap: 'var(--ara-spacing-xl)',
                }}
            >
                <div style={{ flex: 1 }} />
                <h1
                    style={{
                        fontSize: 48,
                        fontWeight: 700,
                        color: 'var(--ara-primary)',
                        margin: 0,
                        letterSpacing: 1,
                    }}
                >
                    ARA
                </h1>
                <div style={{ flex: 1 }} />

                <button
                    type="button"
                    onClick={onSsoLogin}
                    style={{
                        width: '100%',
                        maxWidth: 320,
                        padding: '14px 20px',
                        borderRadius: 'var(--ara-radius-md)',
                        border: 0,
                        background: 'var(--ara-primary)',
                        color: 'var(--ara-text-on-primary)',
                        fontSize: 15,
                        fontWeight: 700,
                        cursor: 'pointer',
                    }}
                >
                    SPARCS SSO 로그인
                </button>

                <footer
                    style={{
                        fontSize: 12,
                        color: 'var(--ara-text-tertiary)',
                        marginTop: 'var(--ara-spacing-xl)',
                    }}
                >
                    © SPARCS Ara
                </footer>
            </div>
        </Screen>
    );
}
