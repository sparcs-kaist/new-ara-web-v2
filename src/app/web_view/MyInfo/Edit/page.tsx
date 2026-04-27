'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Screen, AppHeader } from '@/app/web_view/_components';
import { fetchMe, updateUser } from '@/lib/api/user';

interface MeProfile {
    id: number;
    user?: number;
    nickname?: string;
    picture?: string | null;
    see_sexual?: boolean;
    see_social?: boolean;
}

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
            alert('저장에 실패했어요. 잠시 후 다시 시도해 주세요.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <Screen withTabBar={false}>
            <AppHeader title="프로필 수정" />

            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    padding: 'var(--ara-spacing-xl) var(--ara-spacing-lg)',
                    gap: 'var(--ara-spacing-md)',
                }}
            >
                <div
                    style={{
                        width: 96,
                        height: 96,
                        borderRadius: 999,
                        background: 'var(--ara-bg-muted)',
                        backgroundImage: previewUrl ? `url(${previewUrl})` : undefined,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                    }}
                />
                <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    style={{
                        background: 'transparent',
                        border: 0,
                        color: 'var(--ara-primary)',
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: 'pointer',
                    }}
                >
                    변경
                </button>
                <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={onPickFile}
                />
            </div>

            <label
                style={{
                    display: 'block',
                    padding: '0 var(--ara-spacing-lg)',
                    fontSize: 12,
                    color: 'var(--ara-text-secondary)',
                    marginBottom: 6,
                }}
            >
                닉네임
            </label>
            <div style={{ padding: '0 var(--ara-spacing-lg)' }}>
                <input
                    type="text"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    placeholder="닉네임을 입력하세요"
                    style={{
                        width: '100%',
                        padding: '12px 14px',
                        fontSize: 14,
                        borderRadius: 'var(--ara-radius-md)',
                        border: '1px solid var(--ara-divider-strong)',
                        background: 'var(--ara-bg)',
                        color: 'var(--ara-text-primary)',
                        outline: 'none',
                    }}
                />
            </div>

            <div
                style={{
                    position: 'fixed',
                    left: 0,
                    right: 0,
                    bottom: 'var(--ara-safe-bottom)',
                    padding: 'var(--ara-spacing-lg)',
                    background: 'var(--ara-bg)',
                    borderTop: '1px solid var(--ara-divider)',
                }}
            >
                <button
                    type="button"
                    onClick={onSave}
                    disabled={saving || !nickname.trim()}
                    style={{
                        width: '100%',
                        padding: '14px',
                        borderRadius: 'var(--ara-radius-md)',
                        border: 0,
                        background: 'var(--ara-primary)',
                        color: 'var(--ara-text-on-primary)',
                        fontSize: 15,
                        fontWeight: 700,
                        cursor: saving ? 'default' : 'pointer',
                        opacity: !nickname.trim() ? 0.5 : 1,
                    }}
                >
                    {saving ? '저장 중...' : '저장'}
                </button>
            </div>
        </Screen>
    );
}
