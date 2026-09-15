'use client';

import { useEffect, useState } from 'react';
import {
    CenteredSpinner,
    Close2Icon,
    LeftChevronIcon,
    Screen,
    WarningIcon,
} from '@/app/web_view/_components';
import { useSafeBack } from '@/app/web_view/hooks/useSafeBack';
import { deleteBlock, fetchBlocks } from '@/lib/api/user';

interface BlockUserProfile {
    nickname?: string | null;
    picture?: string | null;
}

interface BlockItem {
    id: number;
    user?: { profile?: BlockUserProfile } | null;
    blocked?: { profile?: BlockUserProfile } | null;
    blocked_nickname?: string | null;
    blocked_picture?: string | null;
}

function pickProfile(b: BlockItem): BlockUserProfile {
    return (
        b.blocked?.profile ??
        b.user?.profile ??
        ({
            nickname: b.blocked_nickname ?? null,
            picture: b.blocked_picture ?? null,
        } as BlockUserProfile)
    );
}

/**
 * Faithful port of the `BlockedUserDialog` body in `lib/widgets/dialogs.dart`,
 * adapted from a modal dialog into a dedicated route — modals are awkward in
 * the WebView shell.
 *
 *   AppBar : red ‹ back, centered "차단한 유저 목록" 18/w700 ED3A3A.
 *   List   : 50px rows — 40×40 grey avatar (or warning.svg fallback) ─20px─
 *            nickname 15/w500  ─flex─  close-2 25×25 unblock icon.
 *   Empty  : "차단된 사용자가 없습니다." 15/w500 black centered.
 */
export default function BlockedUsersPage() {
    const onBack = useSafeBack();
    const [items, setItems] = useState<BlockItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [removing, setRemoving] = useState<number | null>(null);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            setLoading(true);
            try {
                const data = await fetchBlocks();
                if (cancelled) return;
                const list = Array.isArray(data) ? data : (data?.results ?? []);
                setItems(list as BlockItem[]);
            } catch (e) {
                console.warn('fetchBlocks failed', e);
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    const onUnblock = async (id: number) => {
        if (removing != null) return;
        setRemoving(id);
        try {
            await deleteBlock(id);
            setItems((prev) => prev.filter((b) => b.id !== id));
        } catch (e) {
            console.warn('deleteBlock failed', e);
        } finally {
            setRemoving(null);
        }
    };

    return (
        <Screen withTabBar={false}>
            <header className="sticky top-[var(--ara-safe-top)] z-40 flex h-14 items-center bg-white">
                <button
                    type="button"
                    onClick={onBack}
                    aria-label="뒤로"
                    className="flex h-14 w-14 items-center justify-center text-ara_red"
                >
                    <LeftChevronIcon size={35} />
                </button>
                <h1 className="absolute left-0 right-0 mx-auto w-fit text-[18px] font-bold text-ara_red">
                    차단한 유저 목록
                </h1>
            </header>

            {loading ? (
                <CenteredSpinner padY={32} />
            ) : items.length === 0 ? (
                <div className="flex h-[55px] items-center justify-center text-[15px] font-medium text-black">
                    차단된 사용자가 없습니다.
                </div>
            ) : (
                <ul className="px-[15px]">
                    {items.map((b, idx) => {
                        const profile = pickProfile(b);
                        return (
                            <li key={b.id}>
                                <div className="flex h-[50px] items-center">
                                    <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#9E9E9E] text-white">
                                        {profile.picture ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img
                                                src={profile.picture}
                                                alt=""
                                                className="h-full w-full object-cover"
                                                onError={(e) => {
                                                    (e.currentTarget as HTMLImageElement).style.display = 'none';
                                                }}
                                            />
                                        ) : (
                                            <WarningIcon size={35} />
                                        )}
                                    </span>
                                    <div className="w-5" />
                                    <span className="flex-1 truncate text-[15px] font-medium text-black">
                                        {profile.nickname ?? '닉네임 없음'}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => onUnblock(b.id)}
                                        disabled={removing === b.id}
                                        aria-label="차단 해제"
                                        className="flex h-10 w-10 items-center justify-center bg-transparent text-black disabled:opacity-50"
                                    >
                                        <Close2Icon size={25} />
                                    </button>
                                </div>
                                {idx < items.length - 1 && (
                                    <div className="h-px bg-[#F0F0F0]" />
                                )}
                            </li>
                        );
                    })}
                </ul>
            )}
        </Screen>
    );
}
