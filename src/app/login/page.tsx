"use client";

import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { useTranslation } from "react-i18next"; // i18n 사용 시
import ServiceAraLogo from "@/assets/ServiceAra.svg";

const apiUrl = "https://newara.dev.sparcs.org"; // 필요에 따라 환경변수로 관리

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t, i18n } = useTranslation();

  const changeLocale = useCallback(() => {
    i18n.changeLanguage(i18n.language === "ko" ? "en" : "ko");
  }, [i18n]);

  // next 파라미터 처리
  const referrer = searchParams.get("next") || "";
  const loginUrl = `${apiUrl}/api/users/sso_login/?next=${location.protocol}//${location.host}/login-handler?link=${referrer}`;

  return (
    <div className="facade">
      <button className="button language-button" onClick={changeLocale}>
        <span className="material-icons">language</span>
        <span className="is-hidden-touch">{t("lang")}</span>
      </button>
      <div className="title">
        <Image className="title__logo" src={ServiceAraLogo} alt="ServiceAra" />
        <div
          className="title__description"
          dangerouslySetInnerHTML={{ __html: t("main") }}
        />
      </div>
      <div className="banners">
        <div className="banner login">
          <div className="banner__identity-bar" />
          <h1 className="banner__title">{t("login-title")}</h1>
          <h2
            className="banner__subtitle"
            dangerouslySetInnerHTML={{ __html: t("login-subtitle") }}
          />
          <a href={loginUrl} className="button banner__button login__link">
            <span className="material-icons">login</span>
            {t("login")}
          </a>
        </div>
        <div className="banner">
          <div className="banner__identity-bar" />
          <h1
            className="banner__title"
            dangerouslySetInnerHTML={{ __html: t("signup-title") }}
          />
          <h2 className="banner__subtitle">{t("signup-subtitle")}</h2>
          <div className="banner__buttons">
            <a
              href="https://bit.ly/sso-signup"
              className="button banner__button"
            >
              {t("signup")}
            </a>
            <a
              href="https://bit.ly/newara-org-signup"
              className="button banner__button"
            >
              {t("apply-organization")}
            </a>
            <a
              href="https://bit.ly/newara-comp-signup"
              className="button banner__button"
            >
              {t("apply-amenity")}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}