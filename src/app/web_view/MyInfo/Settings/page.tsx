'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Screen, AppHeader } from '@/app/web_view/_components';
import { bridge, getBridge } from '@/app/web_view/_bridge';
import { fetchMe, logout, updateDarkMode } from '@/lib/api/user';

interface MeProfile {
    id: number;
    user?: number;
    extra_preferences?: { darkMode?: boolean } | null;
}

export default function SettingsPage() {
    const router = useRouter();
    const [me, setMe] = useState<MeProfile | null>(null);
    const [dark, setDark] = useState(false);
    const [appVersion, setAppVersion] = useState<string>('web');

    useEffect(() => {
        fetchMe()
            .then((data: MeProfile) => {
                setMe(data);
                setDark(Boolean(data?.extra_preferences?.darkMode));
            })
            .catch((e) => console.warn('fetchMe failed', e));
    }, []);

    useEffect(() => {
        let cancelled = false;
        getBridge()
            .ready()
            .then((cap) => {
                if (cancelled) return;
                if (cap?.appVersion) setAppVersion(cap.appVersion);
            });
        return () => {
            cancelled = true;
        };
    }, []);

    const onToggleDark = async (next: boolean) => {
        setDark(next);
        try {
            if (me?.id) await updateDarkMode(me.id, next);
        } catch (e) {
            console.warn('updateDarkMode failed', e);
            setDark(!next);
        }
    };

    const onMail = () => {
        bridge?.send('openExternal', { url: 'mailto:new-ara@sparcs.org' });
    };

    const onLogout = async () => {
        try {
            if (me?.user ?? me?.id) await logout((me?.user ?? me?.id) as number);
        } catch (e) {
            console.warn('logout failed', e);
        }
        try {
            bridge?.send('clearSession');
        } catch (e) {
            console.warn('clearSession failed', e);
        }
        router.replace('/web_view/Login');
    };

    return (
        <Screen withTabBar={false}>
            <AppHeader title="설정" />

            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                <li className="ara-list-row" style={{ cursor: 'default' }}>
                    <span style={{ flex: 1, fontSize: 14 }}>다크 모드</span>
                    <Toggle checked={dark} onChange={onToggleDark} />
                </li>
                <li
                    className="ara-list-row"
                    onClick={() => router.push('/web_view/MyInfo/BlockedUsers')}
                >
                    <span style={{ flex: 1, fontSize: 14 }}>차단된 사용자</span>
                    <Chevron />
                </li>
                <li className="ara-list-row" onClick={() => router.push('/web_view/Terms')}>
                    <span style={{ flex: 1, fontSize: 14 }}>이용약관</span>
                    <Chevron />
                </li>
                <li className="ara-list-row" onClick={onMail}>
                    <span style={{ flex: 1, fontSize: 14 }}>문의하기</span>
                    <Chevron />
                </li>
                <li className="ara-list-row" style={{ cursor: 'default' }}>
                    <span style={{ flex: 1, fontSize: 14 }}>버전</span>
                    <span style={{ color: 'var(--ara-text-tertiary)', fontSize: 13 }}>{appVersion}</span>
                </li>
                <li
                    className="ara-list-row"
                    onClick={onLogout}
                    style={{ marginTop: 'var(--ara-spacing-lg)' }}
                >
                    <span style={{ flex: 1, fontSize: 14, color: 'var(--ara-primary)', fontWeight: 600 }}>
                        로그아웃
                    </span>
                </li>
            </ul>
        </Screen>
    );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            onClick={() => onChange(!checked)}
            style={{
                width: 40,
                height: 24,
                borderRadius: 999,
                border: 0,
                background: checked ? 'var(--ara-primary)' : 'var(--ara-divider-strong)',
                position: 'relative',
                cursor: 'pointer',
                transition: 'background 0.15s ease',
                padding: 0,
            }}
        >
            <span
                aria-hidden
                style={{
                    position: 'absolute',
                    top: 2,
                    left: checked ? 18 : 2,
                    width: 20,
                    height: 20,
                    borderRadius: 999,
                    background: '#FFFFFF',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.15)',
                    transition: 'left 0.15s ease',
                }}
            />
        </button>
    );
}

function Chevron() {
    return (
        <span aria-hidden style={{ color: 'var(--ara-text-tertiary)', fontSize: 18 }}>
            ›
        </span>
    );
}
