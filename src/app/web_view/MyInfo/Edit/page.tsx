'use client';

import { useEffect, useRef, useState } from 'react';
import {
    CameraIcon,
    LeftChevronIcon,
    Screen,
} from '@/app/web_view/_components';
import { useSafeBack } from '@/app/web_view/hooks/useSafeBack';
import { fetchMe, updateUser } from '@/lib/api/user';

interface MeProfile {
    id: number;
    user?: number;
    nickname?: string;
    picture?: string | null;
    email?: string | null;
    see_sexual?: boolean;
    see_social?: boolean;
}

/**
 * Faithful port of `lib/pages/profile_edit_page.dart`.
 *
 *   AppBar: red ‹ back · centered "프로필 수정" 18/w700 · "완료" 17/w500 right.
 *   Body:
 *     - 10px gap
 *     - Round avatar (width-70 diameter), grey 1px border, with a 40×40
 *       black "camera" badge at bottom:0 right:50.
 *     - 40px gap
 *     - Row (width-60): "닉네임" 17/w700 #636363  ─30px─  filled input
 *       (#EBEBEB, 10px radius, 15px left padding).
 *     - Helper text 12/w600 #BFBFBF, 80px left padding.
 *     - 30px gap
 *     - Row (width-60): "이메일" 17/w700 #636363  ─45px─  email 15/w500 #B1B1B1.
 */
export default function ProfileEditPage() {
    const onBack = useSafeBack();
    const fileRef = useRef<HTMLInputElement | null>(null);
    const [me, setMe] = useState<MeProfile | null>(null);
    const [nickname, setNickname] = useState('');
    const [pictureFile, setPictureFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchMe()
            .then((data: MeProfile) => {
                setMe(data);
                setNickname(data.nickname ?? '');
                if (data.picture) setPreviewUrl(data.picture);
            })
            .catch((e) => console.warn('fetchMe failed', e));
    }, []);

    useEffect(() => {
        if (!pictureFile) return;
        const url = URL.createObjectURL(pictureFile);
        setPreviewUrl(url);
        return () => URL.revokeObjectURL(url);
    }, [pictureFile]);

    const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0] ?? null;
        setPictureFile(f);
    };

    const onSubmit = async () => {
        if (!me?.user && !me?.id) return;
        const userId = (me.user ?? me.id) as number;
        const trimmed = nickname.trim();
        if (!trimmed) {
            if (typeof window !== 'undefined') window.alert('닉네임이 작성되지 않았습니다!');
            return;
        }
        setSaving(true);
        try {
            await updateUser(userId, {
                nickname: trimmed,
                picture: pictureFile,
                sexual: Boolean(me.see_sexual),
                social: Boolean(me.see_social),
            });
            onBack();
        } catch (e) {
            console.warn('updateUser failed', e);
            if (typeof window !== 'undefined') {
                // Surface backend nickname constraints (e.g. 3-month
                // change cooldown) so the user knows why the save was
                // rejected — Flutter's profile_edit_page reads
                // response.data['nickname'][0] for the same reason.
                const err = e as { response?: { data?: { nickname?: string[] } } };
                const detail = err?.response?.data?.nickname?.[0];
                window.alert(
                    detail
                        ? `설정 변경 중 문제가 발생했습니다. ${detail}`
                        : '설정 변경 중 문제가 발생했습니다.',
                );
            }
        } finally {
            setSaving(false);
        }
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
                    프로필 수정
                </h1>
                <button
                    type="button"
                    onClick={onSubmit}
                    disabled={saving}
                    className="ml-auto px-[15px] text-[17px] font-medium text-ara_red disabled:opacity-50"
                >
                    완료
                </button>
            </header>

            <div className="flex flex-col items-center">
                <div className="h-[10px]" />

                {/* Round avatar with camera badge — width-70 diameter. */}
                <div
                    className="relative"
                    style={{ width: 'calc(100vw - 70px)', height: 'calc(100vw - 70px)', maxWidth: 320, maxHeight: 320 }}
                >
                    <div className="h-full w-full overflow-hidden rounded-full border border-[#9E9E9E] bg-[#E5E5E5]">
                        {previewUrl && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={previewUrl}
                                alt=""
                                className="h-full w-full object-cover"
                                draggable={false}
                            />
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={() => fileRef.current?.click()}
                        aria-label="프로필 사진 변경"
                        className="absolute bottom-0 right-[50px] flex h-10 w-10 items-center justify-center rounded-full bg-[#333333] text-white"
                    >
                        <CameraIcon size={20} />
                    </button>
                    <input
                        ref={fileRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={onPickFile}
                    />
                </div>

                <div className="h-10" />

                {/* Nickname row */}
                <div className="flex w-[calc(100%-60px)] items-center">
                    <span className="text-[17px] font-bold text-[#636363]">닉네임</span>
                    <div className="w-[30px]" />
                    <div className="flex-1 rounded-[10px] bg-[#EBEBEB]">
                        <input
                            type="text"
                            value={nickname}
                            onChange={(e) => setNickname(e.target.value)}
                            placeholder="변경하실 닉네임을 입력해주세요."
                            className="block h-[44px] w-full bg-transparent pl-[15px] text-[15px] text-black placeholder:text-[#9E9E9E] focus:outline-none"
                        />
                    </div>
                </div>

                <div className="w-[calc(100%-60px)] pl-[80px] pt-[6px] text-[12px] font-semibold text-[#BFBFBF]">
                    닉네임은 한번 변경할 시 3개월간 변경이 불가합니다.
                </div>

                <div className="h-[30px]" />

                {/* Email row — read-only display. */}
                <div className="flex w-[calc(100%-60px)] items-center">
                    <span className="text-[17px] font-bold text-[#636363]">이메일</span>
                    <div className="w-[45px]" />
                    <span className="flex-1 truncate text-[15px] font-medium text-[#B1B1B1]">
                        {me?.email ?? '이메일 정보가 없습니다.'}
                    </span>
                </div>
            </div>
        </Screen>
    );
}
