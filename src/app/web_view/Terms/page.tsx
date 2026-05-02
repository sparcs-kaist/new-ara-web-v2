'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { LeftChevronIcon, Screen } from '@/app/web_view/_components';
import { bridge } from '@/app/web_view/_bridge';
import { useSafeBack } from '@/app/web_view/hooks/useSafeBack';
import { fetchMe, updateTos } from '@/lib/api/user';

function openExternal(url: string) {
    try {
        bridge?.send('openExternal', { url });
        return;
    } catch {
        /* fall through */
    }
    if (typeof window !== 'undefined') {
        window.open(url, '_blank', 'noopener,noreferrer');
    }
}

interface MeProfile {
    id: number;
    user?: number;
    agree_terms_of_service_at?: string | null;
}

/**
 * Faithful port of `lib/pages/terms_and_conditions_page.dart`.
 *
 *   AppBar: red ‹ back · centered "이용약관" 18/w700 ED3A3A.
 *   Body  : 15px outer padding, scrollable card with #F6F6F6 background +
 *           15px inner padding. Text uses two styles —
 *             normal: 16/w500 #4A4A4A, line-height 1.6
 *             bold  : 16/w700 #363636, line-height 1.6
 *           Sub-items live in a 20px-indent block.
 *   Footer: centered max-100×50 ED3A3A button "동의 하기" (or "이미 동의하셨습니다."
 *           text when the user has already agreed). 30px bottom gap.
 *
 *   ?accept=true forces the agree CTA to be the only path forward (used as
 *   a gating step right after SSO login).
 */
export default function TermsPage() {
    const router = useRouter();
    const onBack = useSafeBack();
    const search = useSearchParams();
    const forceAccept = search?.get('accept') === 'true';
    const [me, setMe] = useState<MeProfile | null>(null);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchMe()
            .then((data: MeProfile) => setMe(data))
            .catch(() => {});
    }, []);

    const alreadyAgreed = !!me?.agree_terms_of_service_at;

    const onAccept = async () => {
        if (!me?.user && !me?.id) return;
        if (submitting) return;
        setSubmitting(true);
        try {
            await updateTos((me.user ?? me.id) as number);
            if (forceAccept) router.replace('/web_view/Main');
            else onBack();
        } catch (e) {
            console.warn('updateTos failed', e);
            if (typeof window !== 'undefined') {
                window.alert('동의 처리에 실패했어요. 잠시 후 다시 시도해 주세요.');
            }
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Screen withTabBar={false}>
            <header className="sticky top-[var(--ara-safe-top)] z-40 flex h-14 items-center bg-white">
                {!forceAccept && (
                    <button
                        type="button"
                        onClick={onBack}
                        aria-label="뒤로"
                        className="flex h-14 w-14 items-center justify-center text-ara_red"
                    >
                        <LeftChevronIcon size={35} />
                    </button>
                )}
                <h1 className="absolute left-0 right-0 mx-auto w-fit text-[18px] font-bold text-ara_red">
                    이용약관
                </h1>
            </header>

            <div className="px-[15px] pt-[15px] pb-[15px]">
                <div className="rounded-[2px] bg-[#F6F6F6] p-[15px]">
                    <Body />
                </div>
            </div>

            <div className="flex h-[80px] items-center justify-center">
                {alreadyAgreed && !forceAccept ? (
                    <span className="text-[16px] font-medium text-ara_red">
                        이미 동의하셨습니다.
                    </span>
                ) : (
                    <button
                        type="button"
                        onClick={onAccept}
                        disabled={submitting}
                        className="flex h-[50px] w-[100px] items-center justify-center rounded-[10px] bg-ara_red text-[16px] font-medium text-white disabled:opacity-60"
                    >
                        {submitting ? '처리 중...' : '동의 하기'}
                    </button>
                )}
            </div>
        </Screen>
    );
}

function P({ children }: { children: React.ReactNode }) {
    return (
        <p
            className="m-0 text-[16px] font-medium text-[#4A4A4A]"
            style={{ lineHeight: 1.6 }}
        >
            {children}
        </p>
    );
}

function H({ children }: { children: React.ReactNode }) {
    return (
        <p
            className="m-0 text-[16px] font-bold text-[#363636]"
            style={{ lineHeight: 1.6 }}
        >
            {children}
        </p>
    );
}

function Indent({ children }: { children: React.ReactNode }) {
    return <div className="pl-[20px]">{children}</div>;
}

/** Verbatim ToS body — order, line breaks, and indents copied from the
 *  Flutter `_buildTermsAndConditionsText(Locale('ko'))` branch. */
function Body() {
    return (
        <div className="flex flex-col">
            <P>new Ara (이하 아라) 이용약관은 현재 적용 중입니다.{'\n'}</P>
            <H>제 1조. 아라의 목적</H>
            <Indent>
                <P>
                    1. 아라는 KAIST 구성원의 원활한 정보공유를 위해 KAIST 학부 동아리 SPARCS (이하 &quot;SPARCS&quot;)에서 제공하는 공용 게시판 서비스 (Bulletin Board System) 입니다.
                </P>
                <P>
                    2. 1조 1항에서의 KAIST 구성원이란 교수, 교직원, 그리고 재학생과 졸업생, 입주 업체 등을 나타냅니다.{'\n'}
                </P>
            </Indent>

            <H>제 2조. 가입 및 탈퇴</H>
            <Indent>
                <P>1. 아라는 KAIST 구성원만 이용 가능합니다.</P>
                <P>2. 아라는 SPARCS SSO를 통해 가입할 수 있습니다.</P>
                <P>  - SPARCS SSO에서 카이스트 통합인증으로 가입시 별도 승인 없이 바로 서비스 이용이 가능합니다. (교수, 교직원, 재학생, 졸업생 등)</P>
                <P>  - SPARCS SSO에서 카이스트 통합인증 외 다른 방법으로 가입시 아라 운영진이 승인해야만 서비스 이용이 가능합니다. (입주 업체 등)</P>
                <P>3. 아라는 회원탈퇴 기능이 없습니다. 다만, 아라 운영진에게 회원 탈퇴를 요청할 수 있습니다.</P>
                <P>4. 다음의 경우에는 회원자격이 박탈될 수 있습니다.</P>
                <P>  - 카이스트 구성원이 아닌 것으로 밝혀졌을 경우</P>
                <P>  - new Ara 이용약관에 명시된 회원의 의무를 지키지 않은 경우</P>
                <P>  - 아라 이용 중 정보통신망 이용촉진 및 정보보호 등에 관한 법률 및 관계 법령과 본 약관이 금지하거나 공서양속에 반하는 행위를 하는 경우{'\n'}</P>
            </Indent>

            <H>제 3조. 회원의 의무</H>
            <Indent>
                <P>1. 회원은 아라 이용과 관련하여 다음의 행위를 하여서는 안 됩니다.</P>
                <P>  - SPARCS, 아라 운영진, 또는 특정 개인 및 단체를 사칭하는 행위</P>
                <P>  - 아라를 이용하여 얻은 정보를 원작자나 아라 운영진의 사전 승낙 없이 복사, 복제, 변경, 번역, 출판, 방송, 기타의 방법으로 사용하거나 이를 타인에게 제공하는 행위</P>
                <P>  - 다른 회원의 계정을 부정 사용하는 행위</P>
                <P>  - 타인의 명예를 훼손하거나 모욕하는 행위</P>
                <P>  - 타인의 지적재산권 등의 권리를 침해하는 행위</P>
                <P>  - 해킹행위 또는 컴퓨터바이러스의 유포 행위</P>
                <P>  - 광고성 정보 등 일정한 내용을 지속적으로 전송하는 행위</P>
                <P>  - 서비스의 안전적인 운영에 지장을 주거나 줄 우려가 있는 일체의 행위</P>
                <P>  - 범죄행위를 목적으로 하거나 기타 범죄행위와 관련된 행위</P>
                <P>  - SPARCS의 동의 없이 아라를 영리목적으로 사용하는 행위</P>
                <P>  - 기타 아라의 커뮤니티 강령에 반하거나 아라 서비스 운영상 부적절하다고 판단하는 행위{'\n'}</P>
            </Indent>

            <H>제 4조. 게시물에 대한 권리</H>
            <Indent>
                <P>1. 회원이 아라 내에 올린 게시물의 저작권은 게시한 회원에게 귀속됩니다.</P>
                <P>2. 서비스의 게시물 또는 내용물이 위의 약관에 위배될 경우 사전 통지나 동의 없이 삭제될 수 있습니다.</P>
                <P>3. 제 3조 회원의 의무에 따라, 아라를 이용하여 얻은 정보를 원작자나 아라 운영진의 사전 승낙 없이 복사, 복제, 변경, 번역, 출판, 방송, 기타의 방법으로 사용하거나, 영리목적으로 활용하거나, 이를 타인에게 제공하는 행위는 금지됩니다.{'\n'}</P>
            </Indent>

            <H>제 5조. 책임의 제한</H>
            <Indent>
                <P>1. SPARCS는 다음의 사유로 서비스 제공을 중지하는 것에 대해 책임을 지지 않습니다.</P>
                <P>  - 설비의 보수 등을 위해 부득이한 경우</P>
                <P>  - KAIST가 전기통신서비스를 중지하는 경우</P>
                <P>  - 천재지변, 정전 및 전시 상황인 경우</P>
                <P>  - 기타 본 서비스를 제공할 수 없는 사유가 발생한 경우</P>
                <P>2. SPARCS는 다음의 사항에 대해 책임을 지지 않습니다.</P>
                <P>  - 개재된 회원들의 글에 대한 신뢰도, 정확도</P>
                <P>  - 아라를 매개로 회원 상호 간 및 회원과 제 3자 간에 발생한 분쟁</P>
                <P>  - 기타 아라 사용 중 발생한 피해 및 분쟁{'\n'}</P>
            </Indent>

            <H>제 6조. 문의 및 제보</H>
            <Indent>
                <P>1. 아라에 대한 건의사항 또는 버그에 대한 사항은 구글폼을 통해 문의 및 제보할 수 있습니다.</P>
                <button
                    type="button"
                    onClick={() => openExternal('https://sparcs.page.link/newara-feedback')}
                    className="m-0 bg-transparent text-left text-[16px] font-medium text-blue-600 underline"
                    style={{ lineHeight: 1.6 }}
                >
                    https://sparcs.page.link/newara-feedback
                </button>
                <P>2. 6조 1항의 구글폼이 작동하지 않거나, 기타 사항의 경우 new-ara@sparcs.org 를 통해 문의 및 제보할 수 있습니다.{'\n'}</P>
            </Indent>

            <H>제 7조. 게시, 개정 및 해석</H>
            <Indent>
                <P>1. 아라 운영진은 본 약관에 대해 아라 회원가입시 회원의 동의를 받습니다.</P>
                <P>2. 아라 운영진은 약관의규제에관한법률, 정보통신망이용촉진및정보보호등에관한법률 등 관련법을 위배하지 않는 범위에서 본 약관을 개정할 수 있습니다.</P>
                <P>3. 본 약관을 개정하는 경우 적용일자, 개정 내용 및 사유를 명시하여 개정 약관의 적용일자 7일 전부터 적용일자 전일까지 아라의 &lsquo;뉴아라 공지&rsquo; 게시판을 통해 공지합니다.</P>
                <P>4. 회원은 개정약관이 공지된 지 7일 내에 개정약관에 대한 거부의 의사표시를 할 수 있습니다. 이 경우 회원은 아라 운영진에게 메일을 발송하여 즉시 사용 중인 모든 지원 서비스를 해지하고 본 서비스에서 회원 탈퇴할 수 있습니다.</P>
                <P>5. 아라 운영진은 개정약관이 공지된 지 7일 내에 거부의 의사표시를 하지 않은 회원에 대해 개정약관에 대해 동의한 것으로 간주합니다.</P>
                <P>6. 본 약관의 해석은 아라 운영진이 담당하며, 분쟁이 있을 경우 민법 등 관계 법률과 관례에 따릅니다.{'\n'}</P>
            </Indent>

            <P>본 약관은 2020-09-26부터 적용됩니다.</P>
        </div>
    );
}
