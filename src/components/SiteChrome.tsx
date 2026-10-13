"use client";

import { Nav } from "./Nav";
import { useLocale } from "./LocaleProvider";

export function SiteChrome({ children }: { children: React.ReactNode }) {
  const { t } = useLocale();
  return (
    <>
      <Nav />
      {children}
      <footer className="footer">
        <div className="footer__inner">
          <span>© {new Date().getFullYear()} Luva</span>
          <span>{t("footer.tag")}</span>
        </div>
      </footer>
    </>
  );
}
