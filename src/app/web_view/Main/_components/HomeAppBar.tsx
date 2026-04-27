'use client';

import { useRouter } from 'next/navigation';
import { AraLogo, PostIcon, SearchIcon } from '@/app/web_view/_components';

/**
 * Mirrors the AppBar in `main_page.dart`: 56px tall, ARA logo on the left,
 * write/search icons on the right (both in brand red, 35x35). No border,
 * no shadow — Flutter sets `elevation: 0`.
 */
export function HomeAppBar() {
    const router = useRouter();
    return (
        <header className="sticky top-0 z-40 flex h-14 items-center bg-white px-4">
            <AraLogo width={68} height={37} />
            <div className="ml-auto flex items-center gap-1">
                <button
                    type="button"
                    aria-label="글쓰기"
                    onClick={() => router.push('/web_view/PostWrite')}
                    className="flex h-11 w-11 items-center justify-center text-ara_red"
                >
                    <PostIcon size={35} />
                </button>
                <button
                    type="button"
                    aria-label="검색"
                    onClick={() => router.push('/web_view/Search')}
                    className="flex h-11 w-11 items-center justify-center text-ara_red"
                >
                    <SearchIcon size={35} />
                </button>
            </div>
        </header>
    );
}
