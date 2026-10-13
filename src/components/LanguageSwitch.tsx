"use client";

import type { Locale } from "@/lib/i18n";
import { useLocale } from "./LocaleProvider";

type Props = {
  /** compact = nav; panel = sign-in card */
  variant?: "compact" | "panel";
};

export function LanguageSwitch({ variant = "compact" }: Props) {
  const { t, locale, setLocale, browserLocale, ready } = useLocale();

  if (variant === "panel") {
    return (
      <div className="lang-switch lang-switch--panel">
        <div className="lang-switch__meta">
          <span className="lang-switch__label">{t("auth.language")}</span>
          <span className="lang-switch__hint">
            {ready
              ? `${t("auth.langAuto")} · ${browserLocale === "zh" ? "中文" : "English"}`
              : "…"}
          </span>
        </div>
        <div className="lang-switch__track" role="radiogroup" aria-label={t("auth.language")}>
          <button
            type="button"
            role="radio"
            aria-checked={locale === "zh"}
            className={`lang-switch__btn${locale === "zh" ? " is-active" : ""}`}
            onClick={() => setLocale("zh")}
          >
            中文
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={locale === "en"}
            className={`lang-switch__btn${locale === "en" ? " is-active" : ""}`}
            onClick={() => setLocale("en")}
          >
            EN
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="lang-switch" role="radiogroup" aria-label={t("auth.language")}>
      <button
        type="button"
        role="radio"
        aria-checked={locale === "zh"}
        className={`lang-switch__btn${locale === "zh" ? " is-active" : ""}`}
        onClick={() => setLocale("zh" as Locale)}
        title="中文"
      >
        中
      </button>
      <button
        type="button"
        role="radio"
        aria-checked={locale === "en"}
        className={`lang-switch__btn${locale === "en" ? " is-active" : ""}`}
        onClick={() => setLocale("en" as Locale)}
        title="English"
      >
        EN
      </button>
    </div>
  );
}
