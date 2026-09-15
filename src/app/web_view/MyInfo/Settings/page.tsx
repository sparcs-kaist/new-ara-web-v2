'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    BarriorIcon,
    InformationIcon,
    LeftChevronIcon,
    PostListIcon,
    RightChevronIcon,
    Screen,
} from '@/app/web_view/_components';
import { bridge } from '@/app/web_view/_bridge';
import { useSafeBack } from '@/app/web_view/hooks/useSafeBack';
import http from '@/lib/api/http';
import { fetchMe, logout } from '@/lib/api/user';

interface MeProfile {
    id: number;
    user?: number;
    nickname?: string;
    email?: string | null;
    see_sexual?: boolean;
    see_social?: boolean;
}

/**
 * Faithful port of `lib/pages/setting_page.dart`.
 *
 *   1.  AppBar with red chevron + centered red "설정" 18/w700.
 *   2.  Section header (icon + 18/w700 black) followed by a (width-40) box
 *       with 1px #F0F0F0 border and 10px radius. Same recipe for 게시글 /
 *       차단 / 정보.
 *   3.  TextInfo: 12/w500 #BFBFBF helper line, width-60.
 *   4.  Two standalone red CTA boxes (로그아웃 / 회원탈퇴) each 50px tall.
 */
export default function SettingsPage() {
    const router = useRouter();
    const onBack = useSafeBack();
    const [me, setMe] = useState<MeProfile | null>(null);
    const [seeSexual, setSeeSexual] = useState(true);
    const [seeSocial, setSeeSocial] = useState(true);

    useEffect(() => {
        fetchMe()
            .then((data: MeProfile) => {
                setMe(data);
                setSeeSexual(data?.see_sexual ?? true);
                setSeeSocial(data?.see_social ?? true);
            })
            .catch((e) => console.warn('fetchMe failed', e));
    }, []);

    const userId = me?.user ?? me?.id;

    const patchPreference = async (
        key: 'see_sexual' | 'see_social',
        value: boolean,
    ) => {
        if (!userId) return false;
        try {
            await http.patch(`/user_profiles/${userId}/`, { [key]: value });
            return true;
        } catch (e) {
            console.warn('patch preference failed', e);
            return false;
        }
    };

    const onToggleSexual = async (next: boolean) => {
        setSeeSexual(next);
        const ok = await patchPreference('see_sexual', next);
        if (!ok) setSeeSexual(!next);
    };
    const onToggleSocial = async (next: boolean) => {
        setSeeSocial(next);
        const ok = await patchPreference('see_social', next);
        if (!ok) setSeeSocial(!next);
    };

    const onContact = () => {
        if (typeof window !== 'undefined') {
            window.location.href = 'mailto:ara@sparcs.org';
        }
    };

    const onLogout = async () => {
        if (typeof window !== 'undefined' && !window.confirm('로그아웃 하시겠습니까?')) return;
        try {
            if (userId) await logout(userId);
        } catch (e) {
            console.warn('logout failed', e);
        }
        try {
            bridge?.send('clearSession');
        } catch {
            /* noop */
        }
        router.replace('/web_view/Login');
    };

    const onWithdraw = () => {
        if (typeof window === 'undefined') return;
        const body =
            `유저 번호: ${userId ?? ''}\n닉네임: ${me?.nickname ?? ''}\n이메일: ${me?.email ?? ''}\n` +
            `탈퇴 요청드립니다(Ara 관리자가 확인 후 처리해드리며 조금의 시간이 소요될 수 있습니다)`;
        const url =
            'mailto:ara@sparcs.org' +
            `?subject=${encodeURIComponent('Ara 회원 탈퇴 요청')}` +
            `&body=${encodeURIComponent(body)}`;
        window.location.href = url;
    };

    return (
        <Screen withTabBar={false}>
            {/* Header — centered title with red back chevron. */}
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
                    설정
                </h1>
            </header>

            <div className="flex flex-col items-center pb-[60px]">
                <div className="h-[23px]" />

                {/* 게시글 설정 */}
                <SectionHeader
                    icon={<PostListIcon size={34} className="text-black" />}
                    label="게시글 설정"
                />
                <div className="h-[7px]" />
                <BoxRow height={94}>
                    <ToggleRow
                        label="성인글 보기"
                        checked={seeSexual}
                        onChange={onToggleSexual}
                    />
                    <div className="h-4" />
                    <ToggleRow
                        label="정치글 보기"
                        checked={seeSocial}
                        onChange={onToggleSocial}
                    />
                </BoxRow>

                <div className="h-6" />

                {/* 차단 */}
                <SectionHeader
                    icon={<BarriorIcon size={34} className="text-black" />}
                    label="차단"
                />
                <div className="h-[7px]" />
                <BoxRow
                    height={50}
                    onClick={() => router.push('/web_view/MyInfo/BlockedUsers')}
                    centered
                >
                    <span className="text-[16px] font-medium text-ara_red">
                        차단한 유저 목록
                    </span>
                </BoxRow>
                <div className="h-[5px]" />
                <TextInfo>
                    유저 차단은 게시글의 &lsquo;더보기&rsquo; 기능에서 하실 수 있습니다. 하루에 최대 10번만 변경 가능합니다.
                </TextInfo>

                <div className="h-5" />

                {/* 정보 */}
                <SectionHeader
                    icon={<InformationIcon size={36} className="text-black" />}
                    label="정보"
                />
                <div className="h-[7px]" />
                <BoxRow height={134}>
                    {/* 다크 모드 — disabled (Beta) */}
                    <div className="flex items-center justify-between">
                        <div className="ml-[10px] flex items-center">
                            <span className="text-[16px] font-medium text-[#9E9E9E]">
                                다크 모드
                            </span>
                            <span className="ml-[6px] rounded-md bg-[#E5E5E5] px-[6px] py-[2px] text-[10px] font-semibold text-[#646464]">
                                Beta 준비중
                            </span>
                        </div>
                        <span className="mr-[10px] inline-block opacity-40">
                            <Toggle checked={false} disabled onChange={() => {}} />
                        </span>
                    </div>
                    <div className="h-4" />
                    {/* 이용약관 */}
                    <RowLink
                        label="이용약관"
                        onClick={() => router.push('/web_view/Terms')}
                    />
                    <div className="h-4" />
                    {/* 문의 */}
                    <RowLink label="운영진에게 문의하기" onClick={onContact} />
                </BoxRow>

                <div className="h-5" />

                <BoxRow height={50} onClick={onLogout} centered>
                    <span className="text-[16px] font-medium text-ara_red">
                        로그아웃
                    </span>
                </BoxRow>

                <div className="h-5" />

                <BoxRow height={50} onClick={onWithdraw} centered>
                    <span className="text-[16px] font-medium text-ara_red">
                        회원탈퇴
                    </span>
                </BoxRow>
                <div className="h-[5px]" />
                <TextInfo>
                    회원 탈퇴는 Ara 관리자가 확인 후 처리해드리며, 최대 24시간이 소요될 수 있습니다.
                </TextInfo>
            </div>
        </Screen>
    );
}

/* =========================================================================
 * Section building blocks — width-40 box with 1px hairline + 10px radius.
 * ========================================================================= */

function SectionHeader({ icon, label }: { icon: React.ReactNode; label: string }) {
    return (
        <div className="flex w-[calc(100%-50px)] items-center">
            <span className="inline-flex items-center justify-center">{icon}</span>
            <span className="text-[18px] font-bold text-black">{label}</span>
        </div>
    );
}

function BoxRow({
    height,
    children,
    onClick,
    centered = false,
}: {
    height: number;
    children: React.ReactNode;
    onClick?: () => void;
    centered?: boolean;
}) {
    const Tag = onClick ? 'button' : 'div';
    return (
        <Tag
            type={onClick ? 'button' : undefined}
            onClick={onClick}
            className={[
                'w-[calc(100%-40px)] rounded-[10px] border border-[#F0F0F0] bg-transparent',
                centered ? 'flex items-center justify-center' : 'flex flex-col justify-center',
            ].join(' ')}
            style={{ height }}
        >
            {children}
        </Tag>
    );
}

function TextInfo({ children }: { children: React.ReactNode }) {
    return (
        <p className="w-[calc(100%-60px)] text-[12px] font-medium text-[#BFBFBF]">
            {children}
        </p>
    );
}

function ToggleRow({
    label,
    checked,
    onChange,
}: {
    label: string;
    checked: boolean;
    onChange: (v: boolean) => void;
}) {
    return (
        <div className="flex items-center justify-between">
            <span className="ml-[10px] text-[16px] font-medium text-black">{label}</span>
            <span className="mr-[10px] inline-block">
                <Toggle checked={checked} onChange={onChange} />
            </span>
        </div>
    );
}

function RowLink({ label, onClick }: { label: string; onClick: () => void }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="flex w-full items-center justify-between bg-transparent"
        >
            <span className="ml-[10px] text-[16px] font-medium text-black">{label}</span>
            <span className="mr-[10px] inline-flex text-black">
                <RightChevronIcon size={20} />
            </span>
        </button>
    );
}

/** 43×27 Cupertino-style switch with brand red active state. */
function Toggle({
    checked,
    onChange,
    disabled = false,
}: {
    checked: boolean;
    onChange: (v: boolean) => void;
    disabled?: boolean;
}) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            disabled={disabled}
            onClick={() => !disabled && onChange(!checked)}
            className={[
                'relative h-[27px] w-[43px] rounded-full p-0 transition-colors',
                checked ? 'bg-ara_red' : 'bg-[#E5E5E5]',
                disabled ? 'cursor-not-allowed' : '',
            ].join(' ')}
        >
            <span
                aria-hidden
                className="absolute top-[2px] block h-[23px] w-[23px] rounded-full bg-white shadow transition-[left]"
                style={{ left: checked ? 18 : 2 }}
            />
        </button>
    );
}
