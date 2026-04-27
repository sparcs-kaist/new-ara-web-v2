'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppHeader, RightChevronIcon, Screen } from '@/app/web_view/_components';
import { bridge, getBridge } from '@/app/web_view/_bridge';
import { fetchMe, logout, updateDarkMode } from '@/lib/api/user';

interface MeProfile {
    id: number;
    user?: number;
    extra_preferences?: { darkMode?: boolean } | null;
}

/**
 * Mirrors `lib/pages/setting_page.dart`. List of plain rows separated by
 * 1px hairlines — no shadow on the page itself, no border on the rows.
 */
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
        if (typeof window !== 'undefined') {
            window.location.href = 'mailto:new-ara@sparcs.org';
        }
    };

    const onLogout = async () => {
        try {
            if (me?.user ?? me?.id) await logout((me?.user ?? me?.id) as number);
        } catch (e) {
            console.warn('logout failed', e);
        }
        try {
            bridge?.send('clearSession');
        } catch {
            /* noop */
        }
        router.replace('/web_view/Login');
    };

    return (
        <Screen withTabBar={false}>
            <AppHeader title="설정" />

            <ul className="px-5">
                <Row label="다크 모드">
                    <Toggle checked={dark} onChange={onToggleDark} />
                </Row>
                <Row label="차단된 사용자" onClick={() => router.push('/web_view/MyInfo/BlockedUsers')}>
                    <span className="text-[#9E9E9E]">
                        <RightChevronIcon size={16} />
                    </span>
                </Row>
                <Row label="이용약관" onClick={() => router.push('/web_view/Terms')}>
                    <span className="text-[#9E9E9E]">
                        <RightChevronIcon size={16} />
                    </span>
                </Row>
                <Row label="문의하기" onClick={onMail}>
                    <span className="text-[#9E9E9E]">
                        <RightChevronIcon size={16} />
                    </span>
                </Row>
                <Row label="버전">
                    <span className="text-[13px] text-[#B1B1B1]">{appVersion}</span>
                </Row>

                <li
                    onClick={onLogout}
                    role="button"
                    className="mt-6 flex h-[50px] cursor-pointer items-center"
                >
                    <span className="text-[15px] font-medium text-ara_red">로그아웃</span>
                </li>
            </ul>
        </Screen>
    );
}

function Row({
    label,
    onClick,
    children,
}: {
    label: string;
    onClick?: () => void;
    children?: React.ReactNode;
}) {
    return (
        <li
            onClick={onClick}
            role={onClick ? 'button' : undefined}
            className={[
                'flex h-[50px] items-center border-b border-[#F0F0F0]',
                onClick ? 'cursor-pointer' : 'cursor-default',
            ].join(' ')}
        >
            <span className="flex-1 text-[14px] text-black">{label}</span>
            {children}
        </li>
    );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            onClick={() => onChange(!checked)}
            className={[
                'relative h-6 w-10 rounded-full p-0 transition-colors',
                checked ? 'bg-ara_red' : 'bg-[#E5E5E5]',
            ].join(' ')}
        >
            <span
                aria-hidden
                className="absolute top-0.5 h-5 w-5 rounded-full bg-white transition-[left]"
                style={{ left: checked ? 18 : 2 }}
            />
        </button>
    );
}
