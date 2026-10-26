// 서비스 전체 공지 배너 설정. 웹 메인(`/`)과 웹뷰 메인(`/web_view/Main`) 상단에 노출된다.
// 공지를 바꿀 땐 id도 같이 바꿔야 이전 공지를 닫은 사용자에게도 다시 보인다.
// message가 비어 있거나 기간 밖이면 배너를 띄우지 않는다.
// 나중에 백엔드 API로 옮기면 이 값 대신 응답을 GlobalBanner에 넘기면 된다.

export interface GlobalBannerContent {
  id: string;
  message: string;
  link?: string;
  startAt: string;
  endAt: string;
}

export const GLOBAL_BANNER: GlobalBannerContent = {
  id: "2026-10-26",
  message:
    "10/27(화) 00:00 ~ 01:00 서비스 점검으로 인해 서비스 이용이 제한됩니다. 점검 시간 동안 불편을 드려 죄송합니다.",
  link: "",
  startAt: "2026-10-26T00:00:00+09:00",
  endAt: "2026-10-27T01:00:00+09:00",
};

const DISMISSED_KEY = "ara-global-banner-dismissed";

export function isBannerActive(
  banner: GlobalBannerContent,
  now = Date.now(),
): boolean {
  if (!banner.message.trim()) return false;
  return Date.parse(banner.startAt) <= now && now < Date.parse(banner.endAt);
}

export function isBannerDismissed(id: string): boolean {
  try {
    return localStorage.getItem(DISMISSED_KEY) === id;
  } catch {
    return false;
  }
}

export function dismissBanner(id: string) {
  try {
    localStorage.setItem(DISMISSED_KEY, id);
  } catch {
    /* 저장 못 해도 이번 화면에서는 닫힌다 */
  }
}
