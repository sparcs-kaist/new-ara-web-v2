'use client';

import { useEffect, useState } from 'react';
import { LeftChevronIcon, Screen } from '@/app/web_view/_components';
import { useSafeBack } from '@/app/web_view/hooks/useSafeBack';
import { fetchMe } from '@/lib/api/user';

interface MeProfile {
    id: number;
    user?: number;
    nickname?: string;
    email?: string | null;
}

/**
 * Faithful port of `lib/pages/inquiry_page.dart` — the page shown when a
 * previously-withdrawn account tries to log in again.
 *
 *   AppBar: red ‹ back, centered "문의 및 건의" 18/w700 ED3A3A.
 *   Body: a centered red-bordered card whose entire 23/bold red text body
 *         is tappable and opens a mailto: with the user's IDs prefilled.
 */
export default function InquiryPage() {
    const onBack = useSafeBack();
    const [me, setMe] = useState<MeProfile | null>(null);

    useEffect(() => {
        fetchMe()
            .then((data: MeProfile) => setMe(data))
            .catch(() => {});
    }, []);

    const onContact = () => {
        if (typeof window === 'undefined') return;
        const userID = me?.user ?? me?.id ?? '';
        const subject = '재가입 문의';
        const body =
            `추가로 말하실 말이 있다면 여기 아래에 적어주세요.\n\n` +
            `※ Ara 관리자가 48시간 이내로 답변드립니다.※\n\n` +
            `유저 번호: ${userID}\n닉네임: ${me?.nickname ?? ''}\n이메일: ${me?.email ?? ''}\n플랫폼: WebView\n`;
        window.location.href =
            `mailto:ara@sparcs.org?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    };

    return (
        <Screen withTabBar={false}>
            <header className="sticky top-0 z-40 flex h-14 items-center bg-white">
                <button
                    type="button"
                    onClick={onBack}
                    aria-label="뒤로"
                    className="flex h-14 w-14 items-center justify-center text-ara_red"
                >
                    <LeftChevronIcon size={35} />
                </button>
                <h1 className="absolute left-0 right-0 mx-auto w-fit text-[18px] font-bold text-ara_red">
                    문의 및 건의
                </h1>
            </header>

            <div className="flex min-h-[calc(100dvh-56px)] items-center justify-center px-2 py-1">
                <button
                    type="button"
                    onClick={onContact}
                    className="block w-full rounded-lg border-[3.5px] border-ara_red bg-white px-2 py-1 text-left"
                >
                    <span className="block whitespace-pre-line text-[23px] font-bold leading-snug text-ara_red">
                        {`이미 탈퇴 했던 계정입니다.\n재가입을 하고 싶다면 이 링크를 눌러 이메일로 문의하세요.`}
                    </span>
                </button>
            </div>
        </Screen>
    );
}
