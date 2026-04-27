'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppHeader, Screen } from '@/app/web_view/_components';
import { fetchMe, updateUser } from '@/lib/api/user';

interface MeProfile {
    id: number;
    user?: number;
    nickname?: string;
    picture?: string | null;
    see_sexual?: boolean;
    see_social?: boolean;
}

/**
 * Mirrors `lib/pages/profile_edit_page.dart`. A round 96px avatar at the
 * top, "변경" button, a single nickname text field, and a sticky red
 * 저장 CTA at the bottom.
 */
export default function ProfileEditPage() {
    const router = useRouter();
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

    const onSave = async () => {
        if (!me?.id || saving) return;
        setSaving(true);
        try {
            await updateUser(me.id, {
                nickname: nickname.trim(),
                picture: pictureFile,
                sexual: Boolean(me.see_sexual),
                social: Boolean(me.see_social),
            });
            router.back();
        } catch (e) {
            console.warn('updateUser failed', e);
            if (typeof window !== 'undefined') {
                window.alert('저장에 실패했어요. 잠시 후 다시 시도해 주세요.');
            }
        } finally {
            setSaving(false);
        }
    };

    return (
        <Screen withTabBar={false}>
            <AppHeader title="프로필 수정" />

            <div className="flex flex-col items-center gap-3 px-5 pt-8 pb-4">
                <span
                    className="inline-flex h-[96px] w-[96px] items-center justify-center overflow-hidden rounded-full bg-[#E5E5E5]"
                    aria-hidden
                >
                    {previewUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={previewUrl} alt="" className="h-full w-full object-cover" />
                    )}
                </span>
                <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="bg-transparent text-[13px] font-medium text-ara_red"
                >
                    변경
                </button>
                <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={onPickFile}
                />
            </div>

            <label className="block px-5 pb-1 text-[12px] text-[#646464]">닉네임</label>
            <div className="px-5">
                <input
                    type="text"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    placeholder="닉네임을 입력하세요"
                    className="block w-full rounded-[10px] bg-[#F8F8F8] px-3 py-3 text-[14px] text-black placeholder:text-[#BBBBBB] focus:outline-none"
                />
            </div>

            <div
                className="fixed inset-x-0 z-30 bg-white px-5 pt-3"
                style={{
                    bottom: 0,
                    paddingBottom: 'calc(12px + var(--ara-safe-bottom))',
                }}
            >
                <button
                    type="button"
                    onClick={onSave}
                    disabled={saving || !nickname.trim()}
                    className="block h-[50px] w-full rounded-[10px] bg-ara_red text-[15px] font-bold text-white disabled:bg-ara_red_bright"
                >
                    {saving ? '저장 중...' : '저장'}
                </button>
            </div>
        </Screen>
    );
}
