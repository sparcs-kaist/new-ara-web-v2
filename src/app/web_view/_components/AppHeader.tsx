'use client';

import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import { LeftChevronIcon } from './icons';

interface AppHeaderProps {
    /** Title text. Pass `null` to render no title. */
    title?: ReactNode;
    /** Override the default back-arrow leading. Pass `null` to drop it. */
    leading?: ReactNode | null;
    /** Right-side actions (icons, buttons). */
    trailing?: ReactNode;
    /** Custom back handler. Defaults to `router.back()`. */
    onBack?: () => void;
    /** Center vs left-align the title. Defaults to `true` (centered). */
    centerTitle?: boolean;
    /** Optional title colour (e.g. brand red on detail headers). */
    titleClassName?: string;
}

/**
 * Mirrors Flutter's `AppBar`: 56px (default) sticky top bar with no border
 * and no shadow, just the leading chevron, the title, and trailing actions.
 *
 * In Flutter, sub-screen AppBars look like
 *
 *     Scaffold(appBar: AppBar(leading: leftChevron + 게시판이름 in red 17/w500))
 *
 * — i.e. the back arrow and a small board name. Pass that combo via the
 * `leading` slot (or via `title`, depending on the page) to reproduce it.
 */
export function AppHeader({
    title,
    leading,
    trailing,
    onBack,
    centerTitle = true,
    titleClassName,
}: AppHeaderProps) {
    const router = useRouter();

    const handleBack = () => {
        if (onBack) return onBack();
        if (typeof window !== 'undefined' && window.history.length > 1) {
            router.back();
            return;
        }
        // Deep-link entry — no SPA history to pop. Send the user to Main so
        // the back arrow never feels dead and never falls out of /web_view.
        router.replace('/web_view/Main');
    };

    const showDefaultLeading = leading === undefined;

    return (
        <header className="sticky top-[var(--ara-safe-top)] z-40 flex h-14 items-center bg-white px-2">
            <div className="flex min-w-[44px] items-center">
                {showDefaultLeading ? (
                    <button
                        type="button"
                        aria-label="뒤로"
                        onClick={handleBack}
                        className="flex h-11 w-11 items-center justify-center text-ara_red"
                    >
                        <LeftChevronIcon size={28} />
                    </button>
                ) : (
                    leading ?? null
                )}
            </div>
            <h1
                className={[
                    'flex-1 truncate text-[16px] font-semibold text-black',
                    centerTitle ? 'text-center' : 'text-left',
                    titleClassName ?? '',
                ]
                    .filter(Boolean)
                    .join(' ')}
            >
                {title ?? ''}
            </h1>
            <div className="flex min-w-[44px] items-center justify-end gap-1">{trailing ?? null}</div>
        </header>
    );
}
