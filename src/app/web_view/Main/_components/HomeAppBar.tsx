'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AraLogo, NotificationIcon, PostIcon, SearchIcon } from '@/app/web_view/_components';
import { useBridgeEvent } from '@/app/web_view/_bridge';
import { fetchNotifications } from '@/lib/api/notification';

/**
 * Mirrors the AppBar in `main_page.dart`: 56px tall, ARA logo on the left,
 * language/post/search actions on the right (brand red, 35x35), no border or
 * shadow. The web puts 알림 where Flutter had the language toggle.
 */
export function HomeAppBar() {
    const router = useRouter();

    // Mirrors NotificationProvider.checkIsNotReadExist: a single quick fetch
    // to know whether the bell icon needs the red dot.
    const [hasUnread, setHasUnread] = useState(false);
    const [pushTick, setPushTick] = useState(0);
    useBridgeEvent('push:received', () => setPushTick((t) => t + 1));
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
    }, [pushTick]);

    return (
        <header className="sticky top-[var(--ara-safe-top)] z-40 flex h-14 items-center bg-white px-4">
            <AraLogo width={68} height={37} />
            <div className="ml-auto flex items-center gap-1">
                <button
                    type="button"
                    aria-label="알림"
                    onClick={() => router.push('/web_view/Notifications')}
                    className="flex h-11 w-11 items-center justify-center rounded-full text-ara_red"
                >
                    <span className="relative inline-flex">
                        <NotificationIcon size={35} />
                        {hasUnread && (
                            <span className="absolute right-[3px] top-[2px] h-[8px] w-[8px] rounded-full bg-ara_red ring-2 ring-white" />
                        )}
                    </span>
                </button>
                <button
                    type="button"
                    aria-label="글쓰기"
                    onClick={() => router.push('/web_view/PostWrite')}
                    className="flex h-11 w-11 items-center justify-center rounded-full text-ara_red"
                >
                    <PostIcon size={35} />
                </button>
                <button
                    type="button"
                    aria-label="검색"
                    onClick={() => router.push('/web_view/Search')}
                    className="flex h-11 w-11 items-center justify-center rounded-full text-ara_red"
                >
                    <SearchIcon size={35} />
                </button>
            </div>
        </header>
    );
}
