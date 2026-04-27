'use client';

import { usePathname, useRouter } from 'next/navigation';
import type { ReactNode } from 'react';

interface Tab {
    path: string;
    matcher: RegExp;
    label: string;
    icon: ReactNode;
}

const TABS: Tab[] = [
    {
        path: '/web_view/Main',
        matcher: /^\/web_view\/Main\/?$/,
        label: '홈',
        icon: <HomeIcon />,
    },
    {
        path: '/web_view/Board',
        matcher: /^\/web_view\/Board(\/|$)/,
        label: '게시판',
        icon: <BoardIcon />,
    },
    {
        path: '/web_view/Notifications',
        matcher: /^\/web_view\/Notifications(\/|$)/,
        label: '알림',
        icon: <BellIcon />,
    },
    {
        path: '/web_view/MyInfo',
        matcher: /^\/web_view\/MyInfo(\/|$)/,
        label: '내 정보',
        icon: <PersonIcon />,
    },
];

export function BottomTabBar() {
    const pathname = usePathname();
    const router = useRouter();

    return (
        <nav className="ara-tabbar" role="tablist" aria-label="primary">
            {TABS.map((t) => {
                const active = t.matcher.test(pathname ?? '');
                return (
                    <button
                        key={t.path}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        data-active={active}
                        className="ara-tabbar__btn"
                        onClick={() => router.push(t.path)}
                    >
                        <span className="ara-tabbar__icon">{t.icon}</span>
                        <span>{t.label}</span>
                    </button>
                );
            })}
        </nav>
    );
}

export function isTabRoot(pathname: string | null): boolean {
    if (!pathname) return false;
    return TABS.some((t) => t.matcher.test(pathname));
}

function HomeIcon() {
    return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
                d="M4 11L12 4L20 11V19C20 19.5523 19.5523 20 19 20H15V14H9V20H5C4.44772 20 4 19.5523 4 19V11Z"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinejoin="round"
            />
        </svg>
    );
}

function BoardIcon() {
    return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
            <rect x="4" y="5" width="16" height="14" rx="2" stroke="currentColor" strokeWidth="1.6" />
            <path d="M8 9H16M8 13H16M8 17H13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
    );
}

function BellIcon() {
    return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
                d="M6 16V11C6 7.68629 8.68629 5 12 5C15.3137 5 18 7.68629 18 11V16L20 18H4L6 16Z"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinejoin="round"
            />
            <path d="M10 21H14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
    );
}

function PersonIcon() {
    return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
            <circle cx="12" cy="9" r="3.5" stroke="currentColor" strokeWidth="1.6" />
            <path d="M5 19C5 15.6863 8.13401 13 12 13C15.866 13 19 15.6863 19 19" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
    );
}
