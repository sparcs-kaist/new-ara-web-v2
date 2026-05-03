'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { fetchNotifications } from '@/lib/api/notification';
import { HomeIcon, MemberIcon, NotificationIcon, PostListIcon } from './icons';

interface Tab {
    path: string;
    matcher: RegExp;
    icon: (active: boolean, hasUnread: boolean) => ReactNode;
}

const TABS: Tab[] = [
    {
        path: '/web_view/Main',
        matcher: /^\/web_view\/Main\/?$/,
        icon: (active) => <HomeIcon size={36} className={active ? 'text-black' : 'text-[#BBBBBB]'} />,
    },
    {
        path: '/web_view/Board',
        matcher: /^\/web_view\/Board(\/|$)/,
        icon: (active) => <PostListIcon size={36} className={active ? 'text-black' : 'text-[#BBBBBB]'} />,
    },
    {
        path: '/web_view/Notifications',
        matcher: /^\/web_view\/Notifications(\/|$)/,
        icon: (active, hasUnread) => (
            <span className="relative inline-flex">
                <NotificationIcon size={36} className={active ? 'text-black' : 'text-[#BBBBBB]'} />
                {hasUnread && (
                    <span className="absolute right-[5px] top-0 h-[7px] w-[7px] rounded-full bg-ara_red" />
                )}
            </span>
        ),
    },
    {
        path: '/web_view/MyInfo',
        matcher: /^\/web_view\/MyInfo(\/|$)/,
        icon: (active) => <MemberIcon size={36} className={active ? 'text-black' : 'text-[#BBBBBB]'} />,
    },
];

export function BottomTabBar() {
    const pathname = usePathname();
    const router = useRouter();

    // Mirrors NotificationProvider.checkIsNotReadExist: a single quick fetch
    // to know whether the bell icon needs the red dot.
    const [hasUnread, setHasUnread] = useState(false);
    useEffect(() => {
        let cancelled = false;
        fetchNotifications(1, 1)
            .then((res) => {
                if (cancelled) return;
                const list = (res?.results ?? []) as Array<{ is_read?: boolean }>;
                setHasUnread(list.some((n) => n && n.is_read === false));
            })
            .catch(() => {});
        return () => {
            cancelled = true;
        };
    }, [pathname]);

    return (
        <nav
            role="tablist"
            aria-label="primary"
            className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-4 items-stretch border-t border-[#F0F0F0] bg-white"
            style={{ height: 'calc(50px + var(--ara-safe-bottom))', paddingBottom: 'var(--ara-safe-bottom)' }}
        >
            {TABS.map((t) => {
                const active = t.matcher.test(pathname ?? '');
                return (
                    <button
                        key={t.path}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        onClick={() => {
                            if (active) return;
                            const onMain = TABS[0].matcher.test(pathname ?? '');
                            const targetMain = t.path === '/web_view/Main';
                            // Instagram-style: Main is the only stack root.
                            // - Main → tab: push, so hardware back returns
                            //   to Main.
                            // - tab → tab (non-Main): replace, so back from
                            //   any tab lands on Main rather than ping-pong.
                            // - tab → Main: prefer router.back() so the
                            //   single Main entry pushed from Main → tab is
                            //   actually consumed (no phantom dup that would
                            //   eat a back press); fall back to replace if
                            //   the user deep-linked into a tab.
                            if (onMain) {
                                router.push(t.path);
                            } else if (targetMain && window.history.length > 1) {
                                router.back();
                            } else {
                                router.replace(t.path);
                            }
                        }}
                        className="flex h-[50px] items-center justify-center bg-transparent"
                    >
                        <span className="flex h-9 w-9 items-center justify-center">
                            {t.icon(active, t.path === '/web_view/Notifications' && hasUnread)}
                        </span>
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
