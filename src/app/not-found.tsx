"use client";

import Link from "next/link";
import { useLocale } from "@/components/LocaleProvider";

export default function NotFound() {
  const { t, locale } = useLocale();
  return (
    <main className="page">
      <div className="shell narrow">
        <div className="panel">
          <h1 className="panel__title">404</h1>
          <p className="panel__sub">
            {locale === "zh" ? "页面不存在或链接已失效。" : "This page could not be found."}
          </p>
          <Link className="btn-block" href="/">
            {t("nav.discover")}
          </Link>
        </div>
      </div>
    </main>
  );
}
